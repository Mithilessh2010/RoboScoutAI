<script lang="ts">
  import AutoscoreWorkspace from "$lib/components/autoscore/AutoscoreWorkspace.svelte";
  import Card from "$lib/components/Card.svelte";
  import Head from "$lib/components/Head.svelte";
  import WidthProvider from "$lib/components/WidthProvider.svelte";
  import { onMount } from "svelte";

  const steps = ["Upload Video", "Mark Zones", "Run Detection", "Review Score", "Export Highlights"];
  const uploadUrl = "https://roboscoutai-autoscore-worker.fly.dev/upload-video";
  let currentJobId = "";
  let busy = false, errorMessage = "", message = "", uploadProgress = 0;
  let videoFile: File | null = null;
  let uploadStartedAt = 0, uploadDurationMs: number | null = null;
  let form = { videoName: "", videoUrl: "", redTeam1: "", redTeam2: "", blueTeam1: "", blueTeam2: "", motif: "unknown" };

  async function beginSession() {
    busy = true; errorMessage = ""; message = "";
    try {
      let videoUrl = form.videoUrl.trim();
      let uploadId = "";
      if (videoFile) {
        uploadStartedAt = performance.now();
        let uploaded = videoFile.size > 50 * 1024 * 1024 ? await uploadChunked(videoFile) : await uploadDirect(videoFile);
        uploadDurationMs = performance.now() - uploadStartedAt;
        sessionStorage.setItem("decodeAutoscoreUploadDurationMs", String(uploadDurationMs));
        uploadId = uploaded.uploadId;
      }
      if (!videoUrl && !uploadId) throw new Error("Upload a video or provide a video URL.");
      let response = await fetch("/api/autoscore/jobs", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, matchName: form.videoName || videoFile?.name || "DECODE session", videoName: form.videoName || videoFile?.name || "DECODE session", videoUrl, uploadId }),
      });
      let data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start autoscore session.");
      currentJobId = data.job._id;
      localStorage.setItem("decodeAutoscoreSessionId", currentJobId);
      message = "Upload complete. Preparing playback video...";
    } catch (error) { errorMessage = error instanceof Error ? error.message : String(error); }
    finally { busy = false; uploadProgress = 0; }
  }
  function resetSession() { currentJobId = ""; localStorage.removeItem("decodeAutoscoreSessionId"); }
  async function uploadChunked(file: File) {
    let worker = uploadUrl.replace(/\/upload-video$/, ""), chunkSize = 1024 * 1024, totalChunks = Math.ceil(file.size / chunkSize);
    let started = await fetch(`${worker}/chunked-uploads`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: file.name, totalChunks }) });
    let upload = await started.json(); if (!started.ok) throw new Error(upload.detail ?? "Could not start upload.");
    for (let index = 0; index < totalChunks; index++) {
      let chunk = file.slice(index * chunkSize, (index + 1) * chunkSize);
      let attempts = 0;
      while (true) {
        if (!navigator.onLine) throw new Error("Network offline. Upload paused.");
        try {
          let response = await fetch(`${worker}/chunked-uploads/${upload.uploadId}/chunks/${index}`, { method: "PUT", body: chunk });
          if (!response.ok) {
            let detail = await response.text().catch(() => "");
            throw new Error(`Chunk upload failed: ${response.status} ${detail}`);
          }
          break;
        } catch (err) {
          attempts++;
          if (attempts > 5) throw new Error(`Chunk ${index} failed after ${attempts} attempts: ${err instanceof Error ? err.message : String(err)}`);
          message = `Network issue — retrying chunk ${index + 1}/${totalChunks} (attempt ${attempts})...`;
          let backoff = 500 * Math.pow(2, attempts - 1);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
      uploadProgress = ((index + 1) / totalChunks) * 100;
      message = `Uploading video ${index + 1} of ${totalChunks} chunks...`;
    }
    let completed = await fetch(`${worker}/chunked-uploads/${upload.uploadId}/complete`, { method: "POST" });
    let data = await completed.json(); if (!completed.ok) throw new Error(data.detail ?? "Could not finish upload."); return data;
  }
  function uploadDirect(file: File): Promise<{ uploadId: string }> {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest(); request.open("POST", uploadUrl);
      request.upload.onprogress = (event) => event.lengthComputable && (uploadProgress = (event.loaded / event.total) * 100);
      request.onload = () => { let data = JSON.parse(request.responseText || "{}"); request.status < 300 ? resolve(data) : reject(new Error(data.detail ?? "Upload failed.")); };
      request.onerror = () => reject(new Error("Upload failed."));
      let payload = new FormData(); payload.append("file", file); request.send(payload);
    });
  }
  onMount(() => currentJobId = localStorage.getItem("decodeAutoscoreSessionId") ?? "");
</script>

<Head title="DECODE Autoscore" />
{#if currentJobId}
  <div class="session-head"><button class="secondary" on:click={resetSession}>Start new video</button></div>
  <AutoscoreWorkspace suppliedJobId={currentJobId} embedded />
{:else}
  <WidthProvider width="1120px"><Card>
    <header><h1>DECODE Autoscore</h1><p>Prototype video-based scoring estimate. Not official FTC scoring.</p></header>
    <div class="steps">{#each steps as step, index}<span class:active={index === 0}>{index + 1}. {step}</span>{/each}</div>
    <section class="upload">
      <div>
        <h2>Start with one match video</h2>
        <p>Upload one DECODE video, then mark the field zones directly on the video before running artifact detection.</p>
      </div>
      <form on:submit|preventDefault={beginSession}>
        <input bind:value={form.videoName} placeholder="Optional session name" />
        <input bind:value={form.videoUrl} placeholder="Optional direct video URL" />
        <input type="file" accept="video/*,.mov,.mp4,.webm,.mkv" on:change={(event) => videoFile = event.currentTarget.files?.[0] ?? null} />
        <select bind:value={form.motif}><option value="unknown">Motif unknown</option><option>GPP</option><option>PGP</option><option>PPG</option></select>
        <input bind:value={form.redTeam1} placeholder="Red team 1 optional" /><input bind:value={form.redTeam2} placeholder="Red team 2 optional" />
        <input bind:value={form.blueTeam1} placeholder="Blue team 1 optional" /><input bind:value={form.blueTeam2} placeholder="Blue team 2 optional" />
        <button disabled={busy}>Upload Match Video</button>
      </form>
    </section>
    {#if uploadProgress > 0}<p class="notice">Uploading {uploadProgress.toFixed(0)}%</p>{/if}
    {#if uploadDurationMs != null}<p class="notice">Upload finished in {(uploadDurationMs / 1000).toFixed(1)}s.</p>{/if}
    {#if message}<p class="notice">{message}</p>{/if}{#if errorMessage}<p class="error">{errorMessage}</p>{/if}
  </Card></WidthProvider>
{/if}

<style>
  h1,h2,p{margin:0}.session-head{max-width:1540px;margin:0 auto 10px;padding:0 16px;text-align:right}header{display:grid;gap:6px;margin-bottom:18px}header p,.upload p{color:var(--secondary-text-color)}
  .steps{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}.steps span{padding:8px 10px;border:1px solid var(--sep-color);border-radius:999px;color:var(--secondary-text-color)}.steps .active{border-color:var(--theme-color);color:var(--text-color)}
  .upload{display:grid;grid-template-columns:0.8fr 1.2fr;gap:22px;align-items:start}.upload form{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  input,select,button{padding:12px;border:1px solid var(--sep-color);border-radius:8px;background:var(--form-bg-color);color:var(--text-color)}button{background:var(--theme-color);color:var(--theme-text-color);cursor:pointer}.secondary{background:var(--form-bg-color);color:var(--text-color)}
  input[type="file"],button{grid-column:1/-1}.notice,.error{padding:12px;border-radius:8px;margin-top:12px}.notice{background:var(--green-stat-bg-color)}.error{background:var(--red-stat-bg-color)}
  @media(max-width:850px){.upload,.upload form{grid-template-columns:1fr}}
</style>
