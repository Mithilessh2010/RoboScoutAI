<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import Head from "$lib/components/Head.svelte";
  import WidthProvider from "$lib/components/WidthProvider.svelte";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  const requiredZones = [
    "goal_red", "goal_blue", "square_red", "square_blue", "classifier_red", "classifier_blue",
    "ramp_red", "ramp_blue", "depot_red", "depot_blue", "gate_red", "gate_blue",
    "base_red", "base_blue", "launch_line_red", "launch_line_blue",
  ];
  const optionalZones = ["obelisk_zone", "field_boundary", "loading_zone_red", "loading_zone_blue"];
  const tabs = ["Setup", "Calibrate", "Detect", "Score", "Review", "JSON"];
  let job: any = null, summary: any = null, detections: any[] = [], events: any[] = [], zones: any[] = [];
  let gateEvents: any[] = [], penalties: any[] = [], rampCounts: any[] = [];
  let video: HTMLVideoElement, overlay: HTMLCanvasElement;
  let currentTime = 0, activeTab = "Calibrate", activeZone = "goal_red", selectedZoneId = "";
  let slotIndex = 1, drawMode: "draw" | "select" = "draw", dragMode = "", dragStart: any = null, draftRect: any = null;
  let busy = false, message = "", errorMessage = "";
  let toggles: any = { zones: true, detections: true, labels: true, confidence: true, eventMarkers: true, rampCounts: true, depotCounts: true };
  let manualEvent = { alliance: "red", eventType: "classified", points: 3, confidence: 1, reason: "Manual review adjustment" };
  let gate = { alliance: "red", releasedCount: null, note: "Manual gate opened" };
  let penalty = { committingAlliance: "red", foulType: "minor", count: 1, timestamp: null, note: "" };
  let rampCorrection = { alliance: "red", stableCount: 0, note: "Manual correction" };

  $: jobId = $page.params.jobId;
  $: visibleDetections = detections.filter((d) => Math.abs(d.timestamp - currentTime) < 1.6);
  $: visibleArtifacts = visibleDetections.filter((d) => d.className !== "robot");
  $: visibleRobots = visibleDetections.filter((d) => d.className === "robot");
  $: live = scoreAt(currentTime);
  $: latestRamp = {
    red: latestState("red", currentTime),
    blue: latestState("blue", currentTime),
  };
  $: zoneCoverage = requiredZones.map((zoneType) => ({ zoneType, saved: zones.some((z) => z.zoneType === zoneType) }));
  $: selectedZone = zones.find((z) => z._id === selectedZoneId) ?? null;

  async function api(path: string, init?: RequestInit) {
    let response = await fetch(path, init);
    let data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Request failed.");
    return data;
  }
  async function load() {
    let detail = await api(`/api/autoscore/jobs/${jobId}`);
    job = detail.job; summary = detail.summary;
    job.manualLeave ??= { redTeam1: "unknown", redTeam2: "unknown", blueTeam1: "unknown", blueTeam2: "unknown" };
    job.manualBase ??= { redTeam1: "unknown", redTeam2: "unknown", blueTeam1: "unknown", blueTeam2: "unknown" };
    zones = (await api(`/api/autoscore/jobs/${jobId}/calibration-zones`)).zones;
    detections = (await api(`/api/autoscore/jobs/${jobId}/detections?limit=2000`)).detections ?? [];
    events = (await api(`/api/autoscore/jobs/${jobId}/timeline`)).events ?? [];
    gateEvents = (await api(`/api/autoscore/jobs/${jobId}/gate-events`)).gateEvents ?? [];
    penalties = (await api(`/api/autoscore/jobs/${jobId}/penalties`)).penalties ?? [];
    rampCounts = (await api(`/api/autoscore/jobs/${jobId}/ramp-counts`)).rampCounts ?? [];
    draw();
  }
  async function saveJob() {
    job = (await api(`/api/autoscore/jobs/${jobId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(job) })).job;
    message = "Setup saved.";
  }
  async function run(url: string, success: string) {
    busy = true; errorMessage = "";
    try { await api(url, { method: "POST" }); message = success; await load(); }
    catch (error) { errorMessage = error instanceof Error ? error.message : String(error); }
    finally { busy = false; }
  }
  async function saveZone() {
    let coordinates = draftRect ? rectPoints(draftRect) : selectedZone?.coordinates;
    if (!coordinates?.length) return;
    let zoneType = activeZone;
    let index = zoneType.startsWith("ramp_index_") ? slotIndex : null;
    let alliance = zoneType.includes("_red") ? "red" : zoneType.includes("_blue") ? "blue" : null;
    await api(`/api/autoscore/jobs/${jobId}/calibration-zones`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ zoneType, alliance, shapeType: "rectangle", coordinates, index, frameTimestamp: currentTime }),
    });
    draftRect = null; selectedZoneId = ""; await load();
  }
  async function updateSelectedZone() {
    if (!selectedZone) return;
    await api(`/api/autoscore/jobs/${jobId}/calibration-zones/${selectedZone._id}`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ coordinates: selectedZone.coordinates, shapeType: "rectangle" }),
    });
    message = "Zone updated."; await load();
  }
  async function deleteSelectedZone() {
    if (!selectedZone) return;
    await api(`/api/autoscore/jobs/${jobId}/calibration-zones/${selectedZone._id}`, { method: "DELETE" });
    selectedZoneId = ""; await load();
  }
  async function clearAllZones() {
    await api(`/api/autoscore/jobs/${jobId}/calibration-zones`, { method: "DELETE" });
    selectedZoneId = ""; draftRect = null; await load();
  }
  async function addManualEvent() {
    await api(`/api/autoscore/jobs/${jobId}/timeline`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...manualEvent, timestamp: currentTime, phase: phase(currentTime) }) });
    await recalc();
  }
  async function addGate() {
    await api(`/api/autoscore/jobs/${jobId}/gate-events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...gate, timestamp: currentTime }) });
    await run(`/api/autoscore/jobs/${jobId}/run-full-decode-autoscore`, "Gate event added and score recalculated.");
  }
  async function addPenalty() {
    await api(`/api/autoscore/jobs/${jobId}/penalties`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(penalty) });
    await recalc();
  }
  async function addRampCorrection() {
    await api(`/api/autoscore/jobs/${jobId}/ramp-counts/manual-correction`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...rampCorrection, timestamp: currentTime }) });
    await load();
  }
  async function recalc() {
    summary = (await api(`/api/autoscore/jobs/${jobId}/recalculate-score`, { method: "POST" })).summary;
    await load();
  }
  async function editEvent(event: any) {
    let points = Number(prompt("Points", String(event.points)) ?? event.points);
    let reason = prompt("Reason", event.reason ?? "") ?? event.reason;
    await api(`/api/autoscore/jobs/${jobId}/timeline/${event._id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ points, reason, manualOverride: true, reviewed: true }) });
    await recalc();
  }
  async function deleteEvent(id: string) { await api(`/api/autoscore/jobs/${jobId}/timeline/${id}`, { method: "DELETE" }); await recalc(); }

  function canvasPoint(event: MouseEvent) {
    let rect = overlay.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) };
  }
  function onPointerDown(event: MouseEvent) {
    let point = canvasPoint(event); dragStart = point;
    if (drawMode === "draw") { draftRect = { x1: point.x, y1: point.y, x2: point.x, y2: point.y }; dragMode = "draw"; }
    else {
      let hit = [...zones].reverse().find((zone) => pointInPolygon(point, zone.coordinates));
      selectedZoneId = hit?._id ?? "";
      dragMode = hit ? nearestHandle(point, hit.coordinates) ?? "move" : "";
    }
    draw();
  }
  function onPointerMove(event: MouseEvent) {
    if (!dragMode || !dragStart) return;
    let point = canvasPoint(event);
    if (dragMode === "draw") draftRect = { ...draftRect, x2: point.x, y2: point.y };
    else if (selectedZone) {
      let box = bounds(selectedZone.coordinates);
      if (dragMode === "move") {
        let dx = point.x - dragStart.x, dy = point.y - dragStart.y;
        selectedZone.coordinates = selectedZone.coordinates.map((p: any) => ({ x: clamp(p.x + dx), y: clamp(p.y + dy) }));
        dragStart = point;
      } else {
        if (dragMode.includes("l")) box.x1 = point.x;
        if (dragMode.includes("r")) box.x2 = point.x;
        if (dragMode.includes("t")) box.y1 = point.y;
        if (dragMode.includes("b")) box.y2 = point.y;
        selectedZone.coordinates = rectPoints(box);
      }
    }
    draw();
  }
  function onPointerUp() { dragMode = ""; dragStart = null; }
  function latestState(alliance: string, t: number) { return [...rampCounts].reverse().find((s) => s.alliance === alliance && s.timestamp <= t) ?? null; }
  function seek(timestamp: number) { video.currentTime = timestamp; currentTime = timestamp; draw(); }
  function phase(t: number) { return t <= 30 ? "AUTO" : t >= 150 ? "ENDGAME" : "TELEOP"; }
  function scoreAt(t: number) { return events.filter((e) => e.timestamp <= t).reduce((out, e) => ({ ...out, [e.alliance]: out[e.alliance] + e.points }), { red: 0, blue: 0 } as any); }
  function detectionCenter(d: any) { return d.centerX != null && d.centerY != null ? { x: d.centerX, y: d.centerY } : { x: ((d.x ?? 0) + (d.width ?? 0) / 2) / (d.frameWidth || 1), y: ((d.y ?? 0) + (d.height ?? 0) / 2) / (d.frameHeight || 1) }; }
  function countInZone(zoneType: string) { let zone = zones.find((z) => z.zoneType === zoneType); return zone ? visibleArtifacts.filter((d) => pointInPolygon(detectionCenter(d), zone.coordinates)).length : null; }
  function rectPoints(rect: any) { let x1 = Math.min(rect.x1, rect.x2), x2 = Math.max(rect.x1, rect.x2), y1 = Math.min(rect.y1, rect.y2), y2 = Math.max(rect.y1, rect.y2); return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }]; }
  function bounds(points: any[]) { let xs = points.map((p) => p.x), ys = points.map((p) => p.y); return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) }; }
  function nearestHandle(point: any, points: any[]) { let box = bounds(points), handles: any = { lt: [box.x1, box.y1], rt: [box.x2, box.y1], rb: [box.x2, box.y2], lb: [box.x1, box.y2] }; return Object.entries(handles).find(([, [x, y]]: any) => Math.hypot(point.x - x, point.y - y) < 0.025)?.[0] ?? null; }
  function pointInPolygon(point: any, polygon: any[]) { let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { let { x: xi, y: yi } = polygon[i], { x: xj, y: yj } = polygon[j]; if ((yi > point.y) !== (yj > point.y) && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.000001) + xi) inside = !inside; } return inside; }
  function clamp(n: number) { return Math.max(0, Math.min(1, n)); }
  function colorFor(zoneType: string) { if (zoneType.includes("gate")) return "#ffd166"; if (zoneType.includes("red")) return "#ff6b7a"; if (zoneType.includes("blue")) return "#62b6ff"; if (zoneType.includes("depot")) return "#b86bff"; return "#cbd5e1"; }
  function draw() {
    if (!overlay || !video) return;
    let ctx = overlay.getContext("2d")!, w = overlay.width = overlay.clientWidth, h = overlay.height = overlay.clientHeight;
    ctx.clearRect(0, 0, w, h); ctx.lineWidth = 2; ctx.font = "12px Inter";
    if (toggles.zones) for (let zone of zones) drawZone(ctx, zone.coordinates, colorFor(zone.zoneType), zone.zoneType + (zone.index ? ` ${zone.index}` : ""), zone._id === selectedZoneId, w, h);
    if (draftRect) drawZone(ctx, rectPoints(draftRect), "#ffffff", activeZone, true, w, h);
    if (toggles.detections) for (let detection of visibleDetections) drawDetection(ctx, detection, w, h);
  }
  function drawZone(ctx: any, points: any[], color: string, label: string, selected: boolean, w: number, h: number) {
    if (!points?.length) return; ctx.strokeStyle = color; ctx.fillStyle = `${color}22`; ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h)); ctx.closePath(); ctx.fill(); ctx.stroke();
    let box = bounds(points); ctx.fillStyle = color; ctx.fillText(label, box.x1 * w + 6, box.y1 * h + 14);
    if (selected) for (let p of points) ctx.fillRect(p.x * w - 4, p.y * h - 4, 8, 8);
  }
  function drawDetection(ctx: any, d: any, w: number, h: number) {
    let color = d.className === "robot" ? "#ffd166" : d.className.includes("green") ? "#38d98a" : "#b86bff";
    ctx.strokeStyle = color; ctx.strokeRect((d.x / d.frameWidth) * w, (d.y / d.frameHeight) * h, (d.width / d.frameWidth) * w, (d.height / d.frameHeight) * h);
    if (toggles.labels) { ctx.fillStyle = color; ctx.fillText(`${d.artifactColor || d.className}${toggles.confidence ? ` ${(d.confidence * 100).toFixed(0)}%` : ""}`, (d.x / d.frameWidth) * w, (d.y / d.frameHeight) * h - 5); }
  }
  function fmt(t: number) { return `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(1).padStart(4, "0")}`; }
  onMount(() => load().catch((error) => errorMessage = error instanceof Error ? error.message : String(error)));
</script>

<Head title="DECODE Autoscore Cockpit" />
<WidthProvider width="1540px"><Card>
{#if job}
  <header class="hero">
    <div><p>DECODE Autoscore</p><h1>{job.matchName || job.videoName}</h1><small>{job.eventName || "Match review"} · {job.status}</small></div>
    <div class="steps">{#each tabs.slice(0, 5) as tab}<button class:active={activeTab === tab} on:click={() => activeTab = tab}>{tab}</button>{/each}</div>
  </header>
  <section class="workspace">
    <div class="stage">
      <div class="video-wrap">
        <video bind:this={video} src={job.videoUrl} controls on:timeupdate={() => { currentTime = video.currentTime; draw(); }} on:loadedmetadata={draw}><track kind="captions" /></video>
        <canvas class:editing={activeTab === "Calibrate"} bind:this={overlay} on:mousedown={onPointerDown} on:mousemove={onPointerMove} on:mouseup={onPointerUp} on:mouseleave={onPointerUp} />
      </div>
      <div class="transport">
        <strong>{fmt(currentTime)}</strong><span>{phase(currentTime)}</span>
        <button class="secondary" on:click={() => video.paused ? video.play() : video.pause()}>{video?.paused ? "Play" : "Pause"}</button>
        <button class="secondary" on:click={() => seek(Math.max(0, currentTime - 5))}>-5s</button>
        <button class="secondary" on:click={() => seek(Math.min(video?.duration || 150, currentTime + 5))}>+5s</button>
        {#each Object.keys(toggles) as key}<label><input type="checkbox" bind:checked={toggles[key]} on:change={draw} />{key}</label>{/each}
      </div>
      <div class="timeline-strip">
        {#each events as event}<button class:event-active={Math.abs(event.timestamp-currentTime)<1.2} on:click={() => seek(event.timestamp)} title={event.reason}>{fmt(event.timestamp)} {event.alliance} {event.eventType} {event.points ? `+${event.points}` : ""}</button>{/each}
      </div>
    </div>
    <aside class="score-rail">
      <article class="alliance red"><small>Red Alliance</small><h2>{live.red}</h2><p>{job.redTeam1 || "?"} / {job.redTeam2 || "?"}</p><span>AUTO {summary?.redAutoScore ?? 0} · TELEOP {summary?.redTeleopScore ?? 0}</span></article>
      <article class="alliance blue"><small>Blue Alliance</small><h2>{live.blue}</h2><p>{job.blueTeam1 || "?"} / {job.blueTeam2 || "?"}</p><span>AUTO {summary?.blueAutoScore ?? 0} · TELEOP {summary?.blueTeleopScore ?? 0}</span></article>
      <article class="telemetry"><h3>Ramp Inventory</h3><p>Red {latestRamp.red?.stableCount ?? "-"} <small>prev {latestRamp.red?.previousStableCount ?? "-"}</small></p><p>Blue {latestRamp.blue?.stableCount ?? "-"} <small>prev {latestRamp.blue?.previousStableCount ?? "-"}</small></p></article>
      <article class="telemetry"><h3>Current Frame</h3><p>{visibleArtifacts.length} artifacts · {visibleRobots.length} robots</p><p>Depot R {countInZone("depot_red") ?? "-"} · B {countInZone("depot_blue") ?? "-"}</p></article>
      {#if summary?.warnings?.length}<article class="warnings"><h3>Review Warnings</h3>{#each summary.warnings.slice(0,4) as warning}<p>{warning}</p>{/each}</article>{/if}
    </aside>
  </section>
  <section class="panel">
    {#if activeTab === "Setup"}
      <h2>Match Setup</h2><div class="form-grid">
        <input bind:value={job.matchName} placeholder="Match name" /><input bind:value={job.eventName} placeholder="Event name" />
        <input bind:value={job.redTeam1} placeholder="Red team 1" /><input bind:value={job.redTeam2} placeholder="Red team 2" />
        <input bind:value={job.blueTeam1} placeholder="Blue team 1" /><input bind:value={job.blueTeam2} placeholder="Blue team 2" />
        <select bind:value={job.motif}><option>unknown</option><option>GPP</option><option>PGP</option><option>PPG</option></select>
      </div>
      <h3>Manual LEAVE / BASE</h3><div class="manual-grid">{#each ["redTeam1","redTeam2","blueTeam1","blueTeam2"] as slot}<label>{slot}<select bind:value={job.manualLeave[slot]}><option>unknown</option><option>yes</option><option>no</option></select><select bind:value={job.manualBase[slot]}><option>unknown</option><option>none</option><option>partial</option><option>full</option></select></label>{/each}</div>
      <button on:click={saveJob}>Save setup</button>
    {:else if activeTab === "Calibrate"}
      <div class="split"><div>
        <h2>Field Calibration</h2><p class="subtle">Choose a zone, then drag directly on the video. Switch to Select to move or resize a saved zone.</p>
        <div class="toolbar-row"><select bind:value={activeZone}>{#each [...requiredZones, ...optionalZones, "ramp_index_red", "ramp_index_blue"] as zone}<option>{zone}</option>{/each}</select>
        {#if activeZone.startsWith("ramp_index_")}<input type="number" min="1" max="9" bind:value={slotIndex} />{/if}
        <button class:secondary={drawMode !== "draw"} on:click={() => drawMode="draw"}>Draw</button><button class:secondary={drawMode !== "select"} on:click={() => drawMode="select"}>Select</button>
        <button on:click={saveZone}>Save zone</button><button class="secondary" on:click={updateSelectedZone}>Save edits</button><button class="secondary" on:click={deleteSelectedZone}>Delete selected</button><button class="danger" on:click={clearAllZones}>Clear all</button></div>
      </div><div class="coverage">{#each zoneCoverage as item}<span class:saved={item.saved}>{item.zoneType}</span>{/each}</div></div>
    {:else if activeTab === "Detect"}
      <h2>Models & Detection</h2><div class="actions"><button disabled={busy} on:click={() => run(`/api/autoscore/jobs/${jobId}/run-artifact-detection`, "Artifact detection started.")}>Run artifact detection</button><button class="secondary" disabled={busy} on:click={() => run(`/api/autoscore/jobs/${jobId}/run-robot-detection`, "Robot detection started.")}>Run robot detection</button></div>
      <dl><dt>Artifacts</dt><dd>{summary?.artifactGreenCount ?? 0} green · {summary?.artifactPurpleCount ?? 0} purple</dd><dt>Robots</dt><dd>{summary?.robotDetectionCount ?? 0}</dd><dt>Average confidence</dt><dd>{Math.round((summary?.averageConfidence ?? 0)*100)}%</dd></dl>
    {:else if activeTab === "Score"}
      <h2>Scoring Controls</h2><div class="actions"><button disabled={busy} on:click={() => run(`/api/autoscore/jobs/${jobId}/run-full-decode-autoscore`, "Full DECODE autoscore calculated.")}>Run full DECODE autoscore</button><button class="secondary" on:click={recalc}>Recalculate after edits</button></div>
      <div class="three"><div><h3>Manual Gate</h3><select bind:value={gate.alliance}><option>red</option><option>blue</option></select><input bind:value={gate.note} /><button on:click={addGate}>Add at current time</button></div>
      <div><h3>Penalty</h3><select bind:value={penalty.committingAlliance}><option>red</option><option>blue</option></select><select bind:value={penalty.foulType}><option>minor</option><option>major</option></select><input type="number" bind:value={penalty.count} /><button on:click={addPenalty}>Add penalty</button></div>
      <div><h3>Ramp Correction</h3><select bind:value={rampCorrection.alliance}><option>red</option><option>blue</option></select><input type="number" bind:value={rampCorrection.stableCount} /><button on:click={addRampCorrection}>Save correction</button></div></div>
    {:else if activeTab === "Review"}
      <div class="review"><div><h2>Timeline</h2>{#each events as event}<div class="event-row"><button on:click={() => seek(event.timestamp)}>{fmt(event.timestamp)} {event.alliance} {event.eventType} {event.points ? `+${event.points}` : ""}<small>{Math.round(event.confidence*100)}% {event.reason}</small></button><button class="secondary" on:click={() => editEvent(event)}>Edit</button><button class="secondary" on:click={() => deleteEvent(event._id)}>Delete</button></div>{/each}</div>
      <div><h2>Add Manual Event</h2><select bind:value={manualEvent.alliance}><option>red</option><option>blue</option></select><select bind:value={manualEvent.eventType}><option>classified</option><option>overflow</option><option>depot</option><option>manual_adjustment</option></select><input type="number" bind:value={manualEvent.points} /><input bind:value={manualEvent.reason} /><button on:click={addManualEvent}>Add at current time</button></div></div>
    {:else}
      <h2>Results JSON</h2><pre>{JSON.stringify({ summary, gateEvents, penalties, rampCounts: rampCounts.slice(-20), events }, null, 2)}</pre>
    {/if}
  </section>
{:else}<p>Loading autoscore job...</p>{/if}
{#if message}<p class="notice">{message}</p>{/if}{#if errorMessage}<p class="error">{errorMessage}</p>{/if}
</Card></WidthProvider>

<style>
  h1,h2,h3,p{margin:0}.hero{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:16px}.hero p{color:var(--secondary-text-color)}
  .steps,.transport,.toolbar-row,.actions{display:flex;gap:8px;flex-wrap:wrap}.steps button{background:var(--form-bg-color);color:var(--text-color)}.steps .active{background:var(--theme-color);color:var(--theme-text-color)}
  .workspace{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:16px}.video-wrap{position:relative;aspect-ratio:16/9;background:#050505;border:1px solid var(--sep-color);border-radius:8px;overflow:hidden}
  video,canvas{position:absolute;inset:0;width:100%;height:100%}canvas{pointer-events:none}.editing{pointer-events:auto}.transport{align-items:center;padding:10px 0;color:var(--secondary-text-color)}label{display:flex;gap:5px;align-items:center}
  .timeline-strip{display:flex;gap:6px;overflow:auto;padding-bottom:4px}.timeline-strip button{white-space:nowrap;background:var(--form-bg-color);color:var(--text-color)}.timeline-strip .event-active{outline:2px solid var(--theme-color)}
  .score-rail{display:grid;gap:10px}.score-rail article,.panel{border:1px solid var(--sep-color);border-radius:8px;padding:14px;background:color-mix(in srgb,var(--form-bg-color) 82%, transparent)}
  .alliance h2{font-size:40px;line-height:1}.alliance.red h2{color:#ff6b7a}.alliance.blue h2{color:#62b6ff}.alliance span,.telemetry small,.subtle{color:var(--secondary-text-color)}
  .warnings p{font-size:12px;margin-top:6px}.panel{margin-top:16px;display:grid;gap:12px}.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.manual-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.manual-grid label{display:grid;grid-template-columns:1fr 90px 90px}
  input,select,button{padding:9px;border:1px solid var(--sep-color);border-radius:8px;background:var(--form-bg-color);color:var(--text-color)}button{background:var(--theme-color);color:var(--theme-text-color);cursor:pointer}.secondary{background:var(--form-bg-color);color:var(--text-color)}.danger{background:#6e2631}
  .split{display:grid;grid-template-columns:1.2fr 1fr;gap:16px}.coverage{display:flex;gap:6px;flex-wrap:wrap}.coverage span{padding:6px 8px;border:1px solid var(--sep-color);border-radius:999px;color:var(--secondary-text-color)}.coverage .saved{border-color:#38d98a;color:#38d98a}
  dl{display:grid;grid-template-columns:180px 1fr;gap:8px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.three>div{display:grid;gap:8px}.review{display:grid;grid-template-columns:minmax(0,1.4fr) 320px;gap:16px}.event-row{display:grid;grid-template-columns:1fr auto auto;gap:6px;margin-top:6px}.event-row button:first-child{text-align:left}.event-row small{display:block}.notice,.error{padding:10px;margin-top:12px;border-radius:8px}.notice{background:var(--green-stat-bg-color)}.error{background:var(--red-stat-bg-color)}pre{max-height:480px;overflow:auto;white-space:pre-wrap;font-size:12px}
  @media(max-width:1000px){.workspace,.split,.three,.review,.form-grid,.manual-grid{grid-template-columns:1fr}}
</style>
