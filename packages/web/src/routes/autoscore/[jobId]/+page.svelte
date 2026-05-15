<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { writable } from "svelte/store";

    let vidEl: HTMLVideoElement | null = null;
    let overlayEl: HTMLDivElement | null = null;
    let drawing = false;
    let startX = 0;
    let startY = 0;
    let rectEl: HTMLDivElement | null = null;

    const job = writable<any>(null);
    const zones = writable<any[]>([]);
    const detections = writable<any[]>([]);
    const timeline = writable<any[]>([]);
    const busy = writable(false);
    let selectedZoneName = "goal_red";
    let liveScore = 0;

    let videoUrl = "";

    const unsubscribe = page.subscribe(async ($page) => {
        const jobId = $page.params.jobId;
        await loadJob(jobId);
    });

    async function loadJob(jobId: string) {
        busy.set(true);
        try {
            let r = await fetch(`/api/autoscore/jobs/${jobId}`);
            let data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data.error || "Could not load job");
            job.set(data.job);
            videoUrl = data.job.videoUrl || "";

            let rz = await fetch(`/api/autoscore/jobs/${jobId}/calibration`);
            if (rz.ok) zones.set(await rz.json().then((d) => d.zones || []));

            let rd = await fetch(`/api/autoscore/jobs/${jobId}/detections?limit=2000`);
            if (rd.ok) detections.set(await rd.json().then((d) => d.detections || []));

            let rt = await fetch(`/api/autoscore/jobs/${jobId}/timeline`);
            if (rt.ok) timeline.set(await rt.json().then((d) => d.events || []));
        } catch (err) {
            console.error(err);
        } finally {
            busy.set(false);
        }
    }

    function toPx(value: number) {
        return `${Math.round(value)}px`;
    }

    function getVideoRect() {
        if (!vidEl) return { left: 0, top: 0, width: 0, height: 0 };
        const r = vidEl.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
    }

    function onPointerDown(e: PointerEvent) {
        if (!overlayEl || !vidEl) return;
        drawing = true;
        const rect = getVideoRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;

        rectEl = document.createElement("div");
        rectEl.style.position = "absolute";
        rectEl.style.border = "2px dashed #00e";
        rectEl.style.left = toPx(startX);
        rectEl.style.top = toPx(startY);
        rectEl.style.width = "0px";
        rectEl.style.height = "0px";
        overlayEl.appendChild(rectEl);
    }

    function onPointerMove(e: PointerEvent) {
        if (!drawing || !rectEl) return;
        const rect = getVideoRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const w = Math.abs(x - startX);
        const h = Math.abs(y - startY);
        rectEl.style.left = toPx(Math.min(x, startX));
        rectEl.style.top = toPx(Math.min(y, startY));
        rectEl.style.width = toPx(w);
        rectEl.style.height = toPx(h);
    }

    async function onPointerUp(e: PointerEvent) {
        if (!drawing || !rectEl || !vidEl) return;
        drawing = false;
        const rect = getVideoRect();
        const left = parseFloat(rectEl.style.left);
        const top = parseFloat(rectEl.style.top);
        const width = parseFloat(rectEl.style.width);
        const height = parseFloat(rectEl.style.height);

        // normalized coords 0..1
        const normalized = {
            x: left / rect.width,
            y: top / rect.height,
            width: width / rect.width,
            height: height / rect.height,
        };

        const jobId = window.location.pathname.split("/").slice(-1)[0];
        const points = [
            { x: normalized.x, y: normalized.y },
            { x: normalized.x + normalized.width, y: normalized.y },
            { x: normalized.x + normalized.width, y: normalized.y + normalized.height },
            { x: normalized.x, y: normalized.y + normalized.height },
        ];
        await fetch(`/api/autoscore/jobs/${jobId}/calibration`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ zoneName: selectedZoneName, points }),
        });
        const rz = await fetch(`/api/autoscore/jobs/${jobId}/calibration`);
        if (rz.ok) zones.set(await rz.json().then((d) => d.zones || []));

        if (rectEl && rectEl.parentNode) rectEl.parentNode.removeChild(rectEl);
        rectEl = null;
    }

    function seekTo(ts: number) {
        if (!vidEl) return;
        vidEl.currentTime = ts;
        vidEl.play();
    }

    async function runPhase1() {
        const jobVal = getStoreValue(job);
        if (!jobVal) return;
        busy.set(true);
        try {
            const r = await fetch(`/api/autoscore/jobs/${jobVal._id}/run-phase1-autoscore`, { method: "POST" });
            if (r.ok) {
                const rt = await fetch(`/api/autoscore/jobs/${jobVal._id}/timeline`);
                if (rt.ok) {
                    const events = await rt.json().then((d) => d.events || []);
                    timeline.set(events);
                    liveScore = events.reduce((sum: number, event: any) => sum + (event.eventType === "score" ? Number(event.details?.points ?? 0) : 0), 0);
                    return;
                }
            }
            await simulatePhase1Locally();
        } catch (err) {
            await simulatePhase1Locally();
        } finally {
            busy.set(false);
        }
    }

    async function simulatePhase1Locally() {
        const detectionList = getStoreValue(detections);
        const events: any[] = [];
        let score = 0;
        let lastScoreAt = -Infinity;
        const cooldownSeconds = 1.0;

        for (const detection of detectionList) {
            const timestamp = Number(detection.timestamp ?? 0);
            const confidence = Number(detection.confidence ?? 0);
            if (confidence < 0.25) continue;

            events.push({
                timestamp,
                eventType: "artifact_detected",
                confidence,
                details: { className: detection.className, confidence },
            });

            if (timestamp - lastScoreAt >= cooldownSeconds) {
                const points = detection.className === "artifact_purple" ? 10 : 5;
                score += points;
                events.push({
                    timestamp: timestamp + 0.001,
                    eventType: "score",
                    confidence,
                    details: { points, reason: `detected_${detection.className}` },
                });
                lastScoreAt = timestamp;
            }
        }

        liveScore = score;
        timeline.set(events);
    }

    function getStoreValue(s) {
        let v;
        s.subscribe((x) => (v = x))();
        return v;
    }

    onMount(() => {
        return () => {
            unsubscribe();
        };
    });

    // Render detection boxes and zones onto overlay when detections or zones update
    $: if (overlayEl) {
        // clear
        overlayEl.innerHTML = "";
        const v = vidEl;
        if (!v) {
            // video not ready yet
        } else {
            const rect = v.getBoundingClientRect();
            const scaleX = rect.width; const scaleY = rect.height;

            for (const z of $zones) {
                // draw zone polygon bounding box
                if (!z.points || z.points.length === 0) continue;
                const minX = Math.min(...z.points.map(p => p.x));
                const minY = Math.min(...z.points.map(p => p.y));
                const maxX = Math.max(...z.points.map(p => p.x));
                const maxY = Math.max(...z.points.map(p => p.y));
                const el = document.createElement('div');
                el.className = 'box';
                el.style.left = Math.round(minX * scaleX) + 'px';
                el.style.top = Math.round(minY * scaleY) + 'px';
                el.style.width = Math.round((maxX - minX) * scaleX) + 'px';
                el.style.height = Math.round((maxY - minY) * scaleY) + 'px';
                el.style.border = '2px dashed rgba(0,200,50,0.9)';
                overlayEl.appendChild(el);
            }

            for (const d of $detections.slice(0,200)) {
                const el = document.createElement('div');
                el.className = 'box';
                // detections are stored in pixels relative to original source; we assume normalized 0..1 if >1 range
                let x = d.x; let y = d.y; let w = d.width; let h = d.height;
                if (x <= 1 && y <= 1 && w <= 1 && h <= 1) {
                    x = x * scaleX; y = y * scaleY; w = w * scaleX; h = h * scaleY;
                }
                el.style.left = Math.round(x) + 'px';
                el.style.top = Math.round(y) + 'px';
                el.style.width = Math.round(w) + 'px';
                el.style.height = Math.round(h) + 'px';
                el.style.border = d.className === 'artifact_green' ? '2px solid rgba(0,255,0,0.9)' : '2px solid rgba(200,0,200,0.9)';
                overlayEl.appendChild(el);
            }
        }
    }
</script>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 16px;
    }
    .video-wrap { position: relative; }
    .overlay {
        position: absolute;
        left: 0; top: 0; right: 0; bottom: 0;
        pointer-events: auto;
    }
    .overlay .box { position: absolute; border: 2px solid rgba(255,0,0,0.8); }
    .controls { margin-bottom: 8px; }
    .timeline { max-height: 60vh; overflow: auto; }
</style>

<div class="container">
    <div>
        <div class="controls">
            <button on:click={() => runPhase1()}>Run Phase 1 Scoring</button>
            <label style="display:inline-flex; align-items:center; gap:8px; margin-left:12px;">
                <span>Zone</span>
                <select bind:value={selectedZoneName}>
                    <option value="goal_red">goal_red</option>
                    <option value="goal_blue">goal_blue</option>
                    <option value="ramp_red">ramp_red</option>
                    <option value="ramp_blue">ramp_blue</option>
                    <option value="base_red">base_red</option>
                    <option value="base_blue">base_blue</option>
                </select>
            </label>
            <strong style="margin-left:12px;">Live score: {liveScore}</strong>
        </div>

        <div class="video-wrap">
            {#if videoUrl}
                <video bind:this={vidEl} src={videoUrl} controls style="max-width:100%" crossorigin="anonymous"></video>
            {:else}
                <p>No public video URL available for this job.</p>
            {/if}
            <div
                bind:this={overlayEl}
                class="overlay"
                on:pointerdown={onPointerDown}
                on:pointermove={onPointerMove}
                on:pointerup={onPointerUp}
            ></div>
        </div>

        <h3>Detections</h3>
        <div style="max-height:240px; overflow:auto">
            {#each $detections.slice(0,200) as d}
                <div>{d.timestamp.toFixed(2)}s — {d.className} ({(d.confidence*100).toFixed(0)}%)</div>
            {/each}
        </div>
    </div>

    <aside>
        <h3>Calibration Zones</h3>
        <div>
            {#each $zones as z}
                <div style="margin-bottom:8px">
                    <strong>{z.zoneName}</strong>
                    <div>Points: {z.points.length}</div>
                    <button on:click={async () => { const jobVal = getStoreValue(job); await fetch(`/api/autoscore/jobs/${jobVal._id}/calibration?zoneName=${z.zoneName}`, { method: 'DELETE' }); const rz = await fetch(`/api/autoscore/jobs/${jobVal._id}/calibration`); if (rz.ok) zones.set(await rz.json().then(d=>d.zones||[])); }}>Delete</button>
                </div>
            {/each}
        </div>

        <h3>Timeline</h3>
        <div class="timeline">
            {#each $timeline as ev}
                <div style="padding:6px; border-bottom:1px solid #eee">
                    <div><strong>{ev.eventType}</strong> @{ev.timestamp.toFixed ? ev.timestamp.toFixed(2) : ev.timestamp}s</div>
                    <div>{ev.details ? (ev.details.summary || JSON.stringify(ev.details)) : ''}</div>
                    {#if ev.timestamp}
                        <button on:click={() => seekTo(ev.timestamp)}>Seek</button>
                    {/if}
                </div>
            {/each}
        </div>
    </aside>
</div>

 
