<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Head from "$lib/components/Head.svelte";
    import WidthProvider from "$lib/components/WidthProvider.svelte";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    const requiredZones = ["goal_red","goal_blue","classifier_red","classifier_blue","square_red","square_blue","ramp_red","ramp_blue","depot_red","depot_blue","base_red","base_blue","launch_line_red","launch_line_blue","gate_red","gate_blue"];
    const optionalZones = ["obelisk_zone","field_boundary","loading_zone_red","loading_zone_blue"];
    let job: any = null, summary: any = null, detections: any[] = [], zones: any[] = [], events: any[] = [];
    let video: HTMLVideoElement, overlay: HTMLCanvasElement;
    let currentTime = 0, activeZone = "goal_red", draftPoints: any[] = [];
    let toggles: Record<string, boolean> = { zones: true, detections: true, labels: true, confidence: true, pattern: true };
    let busy = false, errorMessage = "", message = "";
    let manualEvent = { alliance:"red", eventType:"classified", points:3, confidence:1, reason:"Manual review adjustment" };
    let penalty = { committingAlliance:"red", foulType:"minor", count:1, timestamp:null, note:"" };
    let gate = { alliance:"red", timestamp:0, releasedCount:null, note:"Manual gate opened" };

    $: jobId = $page.params.jobId;
    $: visibleDetections = detections.filter((d) => Math.abs(d.timestamp - currentTime) < 1.6);
    $: live = scoreAt(currentTime);

    async function api(path: string, init?: RequestInit) {
        let response = await fetch(path, init);
        let data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Request failed.");
        return data;
    }
    async function load() {
        let detail = await api(`/api/autoscore/jobs/${jobId}`);
        job = detail.job; summary = detail.summary;
        zones = (await api(`/api/autoscore/jobs/${jobId}/calibration-zones`)).zones;
        detections = (await api(`/api/autoscore/jobs/${jobId}/detections?limit=2000`)).detections ?? [];
        events = (await api(`/api/autoscore/jobs/${jobId}/timeline`)).events;
        job.manualLeave ??= { redTeam1:"unknown", redTeam2:"unknown", blueTeam1:"unknown", blueTeam2:"unknown" };
        job.manualBase ??= { redTeam1:"unknown", redTeam2:"unknown", blueTeam1:"unknown", blueTeam2:"unknown" };
        draw();
    }
    async function saveJob() {
        let data = await api(`/api/autoscore/jobs/${jobId}`, { method:"PUT", headers:{"content-type":"application/json"}, body:JSON.stringify(job) });
        job = data.job; message = "Job settings saved.";
    }
    async function runDetection() { await act(`/api/autoscore/jobs/${jobId}/run-artifact-detection`, "Artifact detection started."); }
    async function runAutoscore() { await act(`/api/autoscore/jobs/${jobId}/run-full-decode-autoscore`, "DECODE autoscore calculated."); await load(); }
    async function act(url: string, success: string) { busy = true; errorMessage = ""; try { await api(url,{method:"POST"}); message = success; } catch(e){ errorMessage = e instanceof Error ? e.message : String(e); } finally { busy = false; } }
    function canvasPoint(event: MouseEvent) {
        let rect = overlay.getBoundingClientRect();
        return { x:(event.clientX-rect.left)/rect.width, y:(event.clientY-rect.top)/rect.height };
    }
    function addPoint(event: MouseEvent) { draftPoints = [...draftPoints, canvasPoint(event)]; draw(); }
    async function saveZone(index?: number) {
        let zoneType = index ? activeZone : activeZone;
        let alliance = zoneType.includes("_red") ? "red" : zoneType.includes("_blue") ? "blue" : null;
        await api(`/api/autoscore/jobs/${jobId}/calibration-zones`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ zoneType, alliance, coordinates:draftPoints, index:index ?? null, frameTimestamp:currentTime }) });
        draftPoints = []; await load();
    }
    async function addManualEvent() {
        await api(`/api/autoscore/jobs/${jobId}/timeline`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ ...manualEvent, timestamp:currentTime, phase:phase(currentTime), manualOverride:true }) });
        await recalc();
    }
    async function deleteEvent(id:string){ await api(`/api/autoscore/jobs/${jobId}/timeline/${id}`,{method:"DELETE"}); await recalc(); }
    async function addPenalty(){ await api(`/api/autoscore/jobs/${jobId}/penalties`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(penalty)}); await recalc(); }
    async function addGate(){ await api(`/api/autoscore/jobs/${jobId}/gate-events`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...gate,timestamp:currentTime})}); await runAutoscore(); }
    async function recalc(){ summary=(await api(`/api/autoscore/jobs/${jobId}/recalculate-score`,{method:"POST"})).summary; await load(); }
    function seek(timestamp:number){ video.currentTime = timestamp; currentTime = timestamp; draw(); }
    function phase(t:number){ return t <= 30 ? "AUTO" : t >= 150 ? "ENDGAME" : "TELEOP"; }
    function scoreAt(t:number){
        let out:any={red:0,blue:0};
        for(let event of events.filter((e)=>e.timestamp<=t)) out[event.alliance]+=event.points;
        return out;
    }
    function draw() {
        if (!overlay || !video) return;
        let ctx = overlay.getContext("2d")!, w=overlay.width=overlay.clientWidth, h=overlay.height=overlay.clientHeight;
        ctx.clearRect(0,0,w,h);
        if(toggles.zones) for(let zone of zones) polygon(ctx,zone.coordinates,w,h,zone.zoneType.includes("red")?"#ff5c70":"#5fa8ff");
        if(draftPoints.length) polygon(ctx,draftPoints,w,h,"#ffd166");
        if(toggles.detections) for(let d of visibleDetections){ ctx.strokeStyle=d.className.includes("green")?"#39d98a":"#b86bff"; ctx.strokeRect((d.x/d.frameWidth)*w,(d.y/d.frameHeight)*h,(d.width/d.frameWidth)*w,(d.height/d.frameHeight)*h); if(toggles.labels){ctx.fillStyle=ctx.strokeStyle;ctx.fillText(`${d.artifactColor||d.className}${toggles.confidence?` ${(d.confidence*100).toFixed(0)}%`:""}`,(d.x/d.frameWidth)*w,(d.y/d.frameHeight)*h-4);} }
    }
    function polygon(ctx:any, points:any[], w:number,h:number,color:string){ if(points.length<2)return; ctx.strokeStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h)); if(points.length>2)ctx.closePath();ctx.stroke(); }
    function fmt(t:number){ let m=Math.floor(t/60), s=(t%60).toFixed(1).padStart(4,"0"); return `${String(m).padStart(2,"0")}:${s}`; }
    onMount(load);
</script>
<Head title="DECODE Autoscore Cockpit" />
<WidthProvider width="1440px">
<Card>
{#if job}
<header><div><h1>{job.matchName || job.videoName}</h1><p>{job.eventName || "DECODE"} · {job.status}</p></div><a href="/autoscore">All jobs</a></header>
<div class="cockpit">
<section class="stage">
<div class="video-wrap">
<video bind:this={video} src={job.videoUrl} controls on:timeupdate={() => {currentTime=video.currentTime;draw();}} on:loadedmetadata={draw}>
<track kind="captions" />
</video>
<canvas bind:this={overlay} on:click={addPoint}></canvas>
</div>
<div class="toolbar">
<strong>{fmt(currentTime)} {phase(currentTime)}</strong>
{#each Object.keys(toggles) as key}<label><input type="checkbox" bind:checked={toggles[key]} on:change={draw}/> {key}</label>{/each}
</div>
<div class="scoreboard">
<article class="red"><h2>Red {job.redTeam1 || "?"} / {job.redTeam2 || "?"}</h2><b>{live.red}</b><small>AUTO {summary?.redAutoScore??0} · TELEOP {summary?.redTeleopScore??0} · RP {summary?.redRP??0}</small></article>
<article class="blue"><h2>Blue {job.blueTeam1 || "?"} / {job.blueTeam2 || "?"}</h2><b>{live.blue}</b><small>AUTO {summary?.blueAutoScore??0} · TELEOP {summary?.blueTeleopScore??0} · RP {summary?.blueRP??0}</small></article>
</div>
</section>
<aside>
<h2>Setup</h2>
<div class="grid">
<input bind:value={job.redTeam1} placeholder="Red team 1"/><input bind:value={job.redTeam2} placeholder="Red team 2"/>
<input bind:value={job.blueTeam1} placeholder="Blue team 1"/><input bind:value={job.blueTeam2} placeholder="Blue team 2"/>
<select bind:value={job.motif}><option>unknown</option><option>GPP</option><option>PGP</option><option>PPG</option></select>
</div>
<h3>Manual LEAVE / BASE</h3>
{#each ["redTeam1","redTeam2","blueTeam1","blueTeam2"] as slot}
<label>{slot}<select bind:value={job.manualLeave[slot]}><option>unknown</option><option>yes</option><option>no</option></select><select bind:value={job.manualBase[slot]}><option>unknown</option><option>none</option><option>partial</option><option>full</option></select></label>
{/each}
<button on:click={saveJob}>Save Setup</button>
<h2>Calibration</h2>
<select bind:value={activeZone}>{#each [...requiredZones,...optionalZones,"ramp_index_red","ramp_index_blue"] as zone}<option>{zone}</option>{/each}</select>
<button class="secondary" on:click={()=>draftPoints=[]}>Clear Draft</button><button on:click={()=>saveZone()}>Save Zone</button>
<p>{draftPoints.length} points drawn</p>
<div class="zone-list">{#each zones as zone}<span>{zone.zoneType}{zone.index?` ${zone.index}`:""}</span>{/each}</div>
<h2>Actions</h2>
<button on:click={runDetection} disabled={busy}>Run Artifact Detection</button>
<button on:click={runAutoscore} disabled={busy}>Run Full DECODE Autoscore</button>
</aside>
</div>
<div class="lower">
<section>
<h2>Timeline</h2>
{#each events as event}
<div class="event-row">
<button class="event" on:click={()=>seek(event.timestamp)}><b>{fmt(event.timestamp)}</b> {event.alliance} {event.eventType} +{event.points} <small>{Math.round(event.confidence*100)}% {event.reason}</small>{#if event.manualOverride}<em>manual</em>{/if}</button>
<button class="delete-event" on:click={()=>deleteEvent(event._id)}>Delete</button>
</div>
{/each}
</section>
<section>
<h2>Manual Review</h2>
<div class="grid"><select bind:value={manualEvent.alliance}><option>red</option><option>blue</option></select><select bind:value={manualEvent.eventType}><option>classified</option><option>overflow</option><option>depot</option><option>manual_adjustment</option></select><input type="number" bind:value={manualEvent.points}/><input bind:value={manualEvent.reason}/></div><button on:click={addManualEvent}>Add Manual Event At Current Time</button>
<div class="grid"><select bind:value={gate.alliance}><option>red</option><option>blue</option></select><input bind:value={gate.note}/></div><button on:click={addGate}>Add Manual Gate Event</button>
<div class="grid"><select bind:value={penalty.committingAlliance}><option>red</option><option>blue</option></select><select bind:value={penalty.foulType}><option>minor</option><option>major</option></select><input type="number" bind:value={penalty.count}/><input bind:value={penalty.note}/></div><button on:click={addPenalty}>Add Penalty</button>
</section>
<section><h2>Summary</h2><pre>{JSON.stringify(summary, null, 2)}</pre></section>
</div>
{:else}<p>Loading autoscore job...</p>{/if}
{#if message}<p class="notice">{message}</p>{/if}{#if errorMessage}<p class="error">{errorMessage}</p>{/if}
</Card></WidthProvider>
<style>
h1,h2,h3,p{margin:0} header{display:flex;justify-content:space-between;margin-bottom:16px}.cockpit{display:grid;grid-template-columns:minmax(0,2fr) 360px;gap:16px}.video-wrap{position:relative;background:#050505;aspect-ratio:16/9}.video-wrap video,.video-wrap canvas{position:absolute;inset:0;width:100%;height:100%}.video-wrap canvas{pointer-events:auto}.toolbar,.scoreboard,.grid{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.scoreboard article{flex:1;padding:12px;border:1px solid var(--sep-color);border-radius:8px;display:grid}.scoreboard b{font-size:32px}.red b{color:#ff5c70}.blue b{color:#5fa8ff} aside{display:grid;gap:10px} input,select,button{padding:9px;border:1px solid var(--sep-color);border-radius:8px;background:var(--form-bg-color);color:var(--text-color)}button{background:var(--theme-color);color:var(--theme-text-color);cursor:pointer}.secondary{background:var(--form-bg-color);color:var(--text-color)} aside label{display:grid;grid-template-columns:1fr 90px 90px;gap:6px;align-items:center}.zone-list{display:flex;gap:6px;flex-wrap:wrap}.zone-list span{border:1px dashed var(--sep-color);padding:5px;border-radius:6px}.lower{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:16px;margin-top:18px}.event-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:start;margin-top:6px}.event{display:block;width:100%;text-align:left}.event small{display:block}.event em{margin-left:6px}.delete-event{background:var(--form-bg-color);color:var(--text-color)}.notice,.error{padding:10px;margin-top:12px;border-radius:8px}.notice{background:var(--green-stat-bg-color)}.error{background:var(--red-stat-bg-color)}pre{white-space:pre-wrap;font-size:12px;max-height:360px;overflow:auto}@media(max-width:1000px){.cockpit,.lower{grid-template-columns:1fr}}
</style>
