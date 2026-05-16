<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import Head from "$lib/components/Head.svelte";
  import WidthProvider from "$lib/components/WidthProvider.svelte";
  import { onMount } from "svelte";

  let jobs: any[] = [];
  let busy = false;
  let errorMessage = "";
  let message = "";
  let uploadProgress = 0;
  let videoFile: File | null = null;
  const uploadUrl = "https://roboscoutai-autoscore-worker.fly.dev/upload-video";
  let form = {
    matchName: "",
    eventName: "",
    videoName: "",
    videoUrl: "",
    redTeam1: "",
    redTeam2: "",
    blueTeam1: "",
    blueTeam2: "",
    motif: "unknown",
  };

  async function loadJobs() {
    let response = await fetch("/api/autoscore/jobs");
    let data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Could not load autoscore jobs.");
    jobs = data.jobs;
  }

  async function createJob() {
    busy = true;
    errorMessage = "";
    message = "";
    try {
      let videoUrl = form.videoUrl.trim();
      if (videoFile) {
        let uploaded =
          videoFile.size > 50 * 1024 * 1024
            ? await uploadToWorkerInChunks(uploadUrl, videoFile)
            : await uploadToWorker(uploadUrl, videoFile);
        let ready = await waitForUpload(uploadUrl, uploaded.uploadId);
        videoUrl = ready.videoUrl;
      }
      let response = await fetch("/api/autoscore/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          videoName: form.videoName || videoFile?.name || form.matchName,
          videoUrl,
        }),
      });
      let data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create job.");
      location.href = `/autoscore/${data.job._id}`;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    } finally {
      busy = false;
      uploadProgress = 0;
    }
  }

  async function uploadToWorkerInChunks(
    uploadUrl: string,
    file: File
  ): Promise<{ uploadId: string }> {
    let workerBaseUrl = uploadUrl.replace(/\/upload-video$/, "");
    let chunkSize = 8 * 1024 * 1024;
    let totalChunks = Math.ceil(file.size / chunkSize);
    let createResponse = await fetch(`${workerBaseUrl}/chunked-uploads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, totalChunks }),
    });
    let upload = await createResponse.json();
    if (!createResponse.ok)
      throw new Error(upload.detail ?? upload.error ?? "Could not start upload.");

    for (let index = 0; index < totalChunks; index += 1) {
      let chunk = file.slice(index * chunkSize, (index + 1) * chunkSize);
      let response = await fetch(
        `${workerBaseUrl}/chunked-uploads/${upload.uploadId}/chunks/${index}`,
        { method: "PUT", body: chunk }
      );
      let data = await response.json();
      if (!response.ok)
        throw new Error(data.detail ?? data.error ?? "Chunk upload failed.");
      uploadProgress = ((index + 1) / totalChunks) * 100;
      message = `Uploading video chunk ${index + 1} of ${totalChunks}...`;
    }

    let completeResponse = await fetch(
      `${workerBaseUrl}/chunked-uploads/${upload.uploadId}/complete`,
      { method: "POST" }
    );
    let completed = await completeResponse.json();
    if (!completeResponse.ok)
      throw new Error(
        completed.detail ?? completed.error ?? "Could not finish upload."
      );
    return completed;
  }

  function uploadToWorker(
    uploadUrl: string,
    file: File
  ): Promise<{ uploadId: string }> {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open("POST", uploadUrl);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable)
          uploadProgress = (event.loaded / event.total) * 100;
      };
      request.onload = () => {
        let data = JSON.parse(request.responseText || "{}");
        if (request.status >= 200 && request.status < 300) resolve(data);
        else
          reject(
            new Error(data.detail ?? data.error ?? "Video upload failed.")
          );
      };
      request.onerror = () => reject(new Error("Video upload failed."));
      let formData = new FormData();
      formData.append("file", file);
      request.send(formData);
    });
  }

  async function waitForUpload(
    uploadUrl: string,
    uploadId: string
  ): Promise<{ videoUrl: string }> {
    let workerBaseUrl = uploadUrl.replace(/\/upload-video$/, "");
    while (true) {
      let response = await fetch(`${workerBaseUrl}/uploads/${uploadId}`);
      let data = await response.json();
      if (!response.ok)
        throw new Error(
          data.detail ?? data.error ?? "Could not read upload status."
        );
      if (data.status === "ready") return data;
      if (data.status === "failed")
        throw new Error(data.errorMessage ?? "Video processing failed.");
      message = "Preparing playback video...";
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }

  function score(job: any) {
    return job.summary
      ? `${job.summary.estimatedRedScore ?? 0} - ${
          job.summary.estimatedBlueScore ?? 0
        }`
      : "-";
  }

  onMount(() => loadJobs().catch((err) => (errorMessage = err.message)));
</script>

<Head title="DECODE Autoscore" />
<WidthProvider width="1240px">
  <Card>
    <header>
      <div>
        <h1>DECODE Autoscore</h1>
        <p>Match video review and autoscoring cockpit</p>
      </div>
      <button class="secondary" on:click={loadJobs}>Refresh</button>
    </header>

    <form class="new-job" on:submit|preventDefault={createJob}>
      <input bind:value={form.matchName} placeholder="Match name" required />
      <input bind:value={form.eventName} placeholder="Event name" />
      <input bind:value={form.videoName} placeholder="Video name" />
      <select bind:value={form.motif}>
        <option value="unknown">Motif unknown</option>
        <option value="GPP">GPP</option>
        <option value="PGP">PGP</option>
        <option value="PPG">PPG</option>
      </select>
      <input bind:value={form.redTeam1} placeholder="Red team 1" />
      <input bind:value={form.redTeam2} placeholder="Red team 2" />
      <input bind:value={form.blueTeam1} placeholder="Blue team 1" />
      <input bind:value={form.blueTeam2} placeholder="Blue team 2" />
      <input
        bind:value={form.videoUrl}
        placeholder="Video URL or upload below"
      />
      <input
        type="file"
        accept="video/*,.mov,.mp4,.webm,.mkv"
        on:change={(event) =>
          (videoFile = event.currentTarget.files?.[0] ?? null)}
      />
      <button disabled={busy}>New Autoscore Job</button>
    </form>

    {#if uploadProgress > 0}<p class="notice">
        Uploading video {uploadProgress.toFixed(0)}%
      </p>{/if}
    {#if message}<p class="notice">{message}</p>{/if}
    {#if errorMessage}<p class="error">{errorMessage}</p>{/if}

    <section class="jobs">
      <div class="table-head">
        <span>Match</span><span>Event</span><span>Teams</span><span>Status</span
        ><span>Score</span>
      </div>
      {#each jobs as job}
        <a class="job-row" href={`/autoscore/${job._id}`}>
          <strong>{job.matchName || job.videoName}</strong>
          <span>{job.eventName || "-"}</span>
          <span
            >{job.redTeam1 || "?"}/{job.redTeam2 || "?"} vs {job.blueTeam1 ||
              "?"}/{job.blueTeam2 || "?"}</span
          >
          <em>{job.status}</em>
          <b>{score(job)}</b>
        </a>
      {:else}
        <p class="empty">No DECODE autoscore jobs yet.</p>
      {/each}
    </section>
  </Card>
</WidthProvider>

<style>
  h1,
  p {
    margin: 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  header p,
  .empty {
    color: var(--secondary-text-color);
  }
  button,
  input,
  select {
    border: 1px solid var(--sep-color);
    border-radius: 8px;
    padding: 12px;
    font: inherit;
    background: var(--form-bg-color);
    color: var(--text-color);
  }
  button {
    background: var(--theme-color);
    color: var(--theme-text-color);
    cursor: pointer;
  }
  button.secondary {
    background: var(--form-bg-color);
    color: var(--text-color);
  }
  .new-job {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .new-job input:nth-of-type(9),
  .new-job input[type="file"],
  .new-job button {
    grid-column: span 2;
  }
  .notice,
  .error {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .notice {
    background: var(--green-stat-bg-color);
    color: var(--green-stat-color);
  }
  .error {
    background: var(--red-stat-bg-color);
    color: var(--red-stat-color);
  }
  .jobs {
    display: grid;
  }
  .table-head,
  .job-row {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1.3fr 0.8fr 0.6fr;
    gap: 12px;
    align-items: center;
    padding: 12px;
  }
  .table-head {
    color: var(--secondary-text-color);
    font-size: var(--sm-font-size);
  }
  .job-row {
    border-top: 1px solid var(--sep-color);
    color: inherit;
    text-decoration: none;
  }
  .job-row em {
    font-style: normal;
  }
  @media (max-width: 850px) {
    .new-job,
    .table-head,
    .job-row {
      grid-template-columns: 1fr;
    }
    .new-job input:nth-of-type(9),
    .new-job input[type="file"],
    .new-job button {
      grid-column: auto;
    }
    .table-head {
      display: none;
    }
  }
</style>
