<script lang="ts">
    import Card from "$lib/components/Card.svelte";
    import Head from "$lib/components/Head.svelte";
    import WidthProvider from "$lib/components/WidthProvider.svelte";
    import { onMount } from "svelte";

    type Summary = {
        totalDetections: number;
        artifactGreenCount: number;
        artifactPurpleCount: number;
        averageConfidence: number;
        maxConfidence: number;
    };

    type Job = {
        _id: string;
        videoName: string;
        videoPath?: string | null;
        videoUrl?: string | null;
        status: "pending" | "running" | "complete" | "failed";
        phase: "artifact_detection";
        errorMessage?: string | null;
        predictionJsonPath?: string | null;
        annotatedFramesPath?: string | null;
        summary?: Summary | null;
    };

    let jobs: Job[] = [];
    let selectedJob: Job | null = null;
    let selectedDetections: any[] = [];
    let selectedSummary: Summary | null = null;
    let videoName = "Tech-Tite";
    let videoPath = "decode-training/raw-videos/unsorted/Tech-Tite.mov";
    let videoUrl = "";
    let videoFile: File | null = null;
    let busy = false;
    let message = "";
    let errorMessage = "";

    $: greenCount = selectedSummary?.artifactGreenCount ?? selectedJob?.summary?.artifactGreenCount ?? 0;
    $: purpleCount = selectedSummary?.artifactPurpleCount ?? selectedJob?.summary?.artifactPurpleCount ?? 0;
    $: totalDetections = selectedSummary?.totalDetections ?? selectedJob?.summary?.totalDetections ?? 0;
    $: averageConfidence =
        selectedSummary?.averageConfidence ?? selectedJob?.summary?.averageConfidence ?? 0;
    $: maxConfidence = selectedSummary?.maxConfidence ?? selectedJob?.summary?.maxConfidence ?? 0;

    async function loadJobs() {
        let response = await fetch("/api/autoscore/jobs");
        let data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.message ?? data.error ?? "Could not load autoscore jobs.");
        jobs = data.jobs;
        if (!selectedJob && jobs.length) {
            await selectJob(jobs[0]);
        } else if (selectedJob) {
            selectedJob = jobs.find((job: Job) => job._id === selectedJob?._id) ?? selectedJob;
        }
    }

    async function createJob() {
        busy = true;
        message = "";
        errorMessage = "";
        try {
            if (videoFile && videoFile.size > 4 * 1024 * 1024) {
                throw new Error(
                    "Vercel cannot accept large match-video uploads through this API. Use a video URL, or run uploads locally."
                );
            }

            let response: Response;
            if (videoFile) {
                let form = new FormData();
                form.set("videoName", videoName);
                form.set("videoPath", videoUrl ? "" : videoPath);
                form.set("videoUrl", videoUrl);
                form.set("videoFile", videoFile);
                response = await fetch("/api/autoscore/jobs", {
                    method: "POST",
                    body: form,
                });
            } else {
                response = await fetch("/api/autoscore/jobs", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ videoName, videoPath: videoUrl ? "" : videoPath, videoUrl }),
                });
            }

            let data = await readApiResponse(response);
            if (!response.ok) throw new Error(data.message ?? data.error ?? "Could not create autoscore job.");
            selectedJob = data.job;
            selectedDetections = [];
            selectedSummary = null;
            message = "Autoscore job created.";
            await loadJobs();
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : String(err);
        } finally {
            busy = false;
        }
    }

    async function runArtifactDetection(job: Job) {
        busy = true;
        message = "";
        errorMessage = "";
        selectedJob = { ...job, status: "running" };
        try {
            let response = await fetch(`/api/autoscore/jobs/${job._id}/run-artifact-detection`, {
                method: "POST",
            });
            let data = await readApiResponse(response);
            if (!response.ok) throw new Error(data.message ?? data.error ?? "Artifact detection failed.");
            message = `Artifact detection complete: ${data.summary.totalDetections} detections.`;
            await loadJobs();
            let refreshed = jobs.find((item) => item._id === job._id);
            if (refreshed) await selectJob(refreshed);
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : String(err);
            await loadJobs();
        } finally {
            busy = false;
        }
    }

    async function runSelectedJob() {
        if (!selectedJob) return;
        await runArtifactDetection(selectedJob);
    }

    async function selectJob(job: Job) {
        selectedJob = job;
        selectedDetections = [];
        selectedSummary = job.summary ?? null;
        if (job.status !== "complete") return;
        let response = await fetch(`/api/autoscore/jobs/${job._id}/detections?limit=500`);
        let data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.message ?? data.error ?? "Could not load detections.");
        selectedSummary = data.summary;
        selectedDetections = data.detections;
    }

    async function readApiResponse(response: Response) {
        let text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            if (response.status === 413) {
                return {
                    error:
                        "The video upload is too large for Vercel's request limit. Use a video URL or run this locally.",
                };
            }
            return { error: text };
        }
    }

    function confidence(value: number) {
        return `${(value * 100).toFixed(1)}%`;
    }

    onMount(() => {
        loadJobs().catch((err) => {
            errorMessage = err instanceof Error ? err.message : String(err);
        });
    });
</script>

<Head title="DECODE Autoscore" />

<WidthProvider width="1180px">
    <Card>
        <div class="header">
            <div>
                <h1>DECODE Autoscore</h1>
                <p>Phase 1 artifact detection review</p>
            </div>
            <button class="secondary" on:click={loadJobs} disabled={busy}>Refresh</button>
        </div>

        <form on:submit|preventDefault={createJob} class="job-form">
            <label>
                <span>Video/job name</span>
                <input bind:value={videoName} placeholder="Tech-Tite" />
            </label>
            <label>
                <span>Local video path</span>
                <input bind:value={videoPath} placeholder="decode-training/raw-videos/unsorted/Tech-Tite.mov" />
            </label>
            <label>
                <span>Video URL</span>
                <input bind:value={videoUrl} placeholder="https://..." />
            </label>
            <label>
                <span>Upload video</span>
                <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv,.avi"
                    on:change={(event) => {
                        videoFile = event.currentTarget.files?.[0] ?? null;
                        if (videoFile) {
                            videoName = videoName || videoFile.name;
                            videoPath = "";
                            videoUrl = "";
                        }
                    }}
                />
            </label>
            <button type="submit" disabled={busy}>Create Job</button>
        </form>

        {#if message}
            <p class="notice">{message}</p>
        {/if}
        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}

        <div class="layout">
            <section class="jobs">
                <h2>Jobs</h2>
                {#if jobs.length}
                    <div class="job-list">
                        {#each jobs as job}
                            <button
                                class:selected={selectedJob?._id === job._id}
                                class="job-row"
                                on:click={() => selectJob(job)}
                            >
                                <span>
                                    <strong>{job.videoName}</strong>
                                    <small>{job.phase}</small>
                                </span>
                                <em class:running={job.status === "running"} class:failed={job.status === "failed"}>
                                    {job.status}
                                </em>
                            </button>
                        {/each}
                    </div>
                {:else}
                    <p class="empty">No autoscore jobs yet.</p>
                {/if}
            </section>

            <section class="review">
                <div class="review-head">
                    <div>
                        <h2>{selectedJob?.videoName ?? "Select a job"}</h2>
                        <p>{selectedJob?.videoPath ?? selectedJob?.videoUrl ?? "No video selected"}</p>
                    </div>
                    {#if selectedJob}
                        <button
                            on:click={runSelectedJob}
                            disabled={busy || selectedJob.status === "running"}
                        >
                            Run Artifact Detection
                        </button>
                    {/if}
                </div>

                <div class="stats">
                    <div>
                        <span>Status</span>
                        <strong>{selectedJob?.status ?? "-"}</strong>
                    </div>
                    <div>
                        <span>Total detections</span>
                        <strong>{totalDetections}</strong>
                    </div>
                    <div>
                        <span>artifact_green</span>
                        <strong>{greenCount}</strong>
                    </div>
                    <div>
                        <span>artifact_purple</span>
                        <strong>{purpleCount}</strong>
                    </div>
                    <div>
                        <span>Average confidence</span>
                        <strong>{confidence(averageConfidence)}</strong>
                    </div>
                    <div>
                        <span>Max confidence</span>
                        <strong>{confidence(maxConfidence)}</strong>
                    </div>
                </div>

                {#if selectedJob?.predictionJsonPath}
                    <div class="paths">
                        <a href="/api/autoscore/jobs/{selectedJob._id}/detections" target="_blank" rel="noreferrer">
                            View prediction JSON
                        </a>
                        <span>{selectedJob.predictionJsonPath}</span>
                        {#if selectedJob.annotatedFramesPath}
                            <span>{selectedJob.annotatedFramesPath}</span>
                        {/if}
                    </div>
                {/if}

                <div class="calibration">
                    <h3>Manual calibration zones</h3>
                    <div>
                        <span>goal_red</span>
                        <span>goal_blue</span>
                        <span>ramp_red</span>
                        <span>ramp_blue</span>
                        <span>base_red</span>
                        <span>base_blue</span>
                    </div>
                </div>

                <div class="detections">
                    <h3>Detections</h3>
                    {#if selectedDetections.length}
                        <table>
                            <thead>
                                <tr>
                                    <th>Frame</th>
                                    <th>Time</th>
                                    <th>Class</th>
                                    <th>Confidence</th>
                                    <th>Box</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each selectedDetections.slice(0, 120) as detection}
                                    <tr>
                                        <td>{detection.frameNumber}</td>
                                        <td>{detection.timestamp.toFixed(2)}s</td>
                                        <td>{detection.className}</td>
                                        <td>{confidence(detection.confidence)}</td>
                                        <td>
                                            {Math.round(detection.x)}, {Math.round(detection.y)},
                                            {Math.round(detection.width)} x {Math.round(detection.height)}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    {:else}
                        <p class="empty">Run detection to review artifact boxes.</p>
                    {/if}
                </div>
            </section>
        </div>
    </Card>
</WidthProvider>

<style>
    h1,
    h2,
    h3,
    p {
        margin: 0;
    }

    .header,
    .review-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--lg-gap);
        margin-bottom: var(--vl-gap);
    }

    .header p,
    .review-head p,
    .empty,
    small {
        color: var(--secondary-text-color);
    }

    button {
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: var(--theme-color);
        color: var(--theme-text-color);
        padding: var(--lg-pad);
        font: inherit;
        cursor: pointer;
    }

    button:disabled {
        opacity: var(--form-disabled-opacity);
        cursor: not-allowed;
    }

    button.secondary {
        background: var(--form-bg-color);
        color: var(--text-color);
    }

    .job-form {
        display: grid;
        grid-template-columns: 1fr 1.3fr 1.3fr 1fr auto;
        gap: var(--lg-gap);
        align-items: end;
        margin-bottom: var(--lg-gap);
    }

    label {
        display: flex;
        flex-direction: column;
        gap: var(--sm-gap);
        min-width: 0;
    }

    label span {
        font-size: var(--sm-font-size);
        color: var(--secondary-text-color);
    }

    input {
        width: 100%;
        min-width: 0;
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        background: var(--form-bg-color);
        color: var(--text-color);
        padding: var(--lg-pad);
        font: inherit;
    }

    .notice,
    .error {
        padding: var(--lg-pad);
        border-radius: 8px;
        margin-bottom: var(--lg-gap);
    }

    .notice {
        background: var(--green-stat-bg-color);
        color: var(--green-stat-color);
    }

    .error {
        background: var(--red-stat-bg-color);
        color: var(--red-stat-color);
    }

    .layout {
        display: grid;
        grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.8fr);
        gap: var(--vl-gap);
        align-items: start;
    }

    .jobs,
    .review {
        min-width: 0;
    }

    .jobs h2,
    .detections h3,
    .calibration h3 {
        margin-bottom: var(--lg-gap);
    }

    .job-list {
        display: grid;
        gap: var(--md-gap);
    }

    .job-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--lg-gap);
        width: 100%;
        background: var(--form-bg-color);
        color: var(--text-color);
        text-align: left;
    }

    .job-row span {
        display: grid;
        gap: var(--sm-gap);
        min-width: 0;
    }

    .job-row strong,
    .paths span {
        overflow-wrap: anywhere;
    }

    .job-row.selected {
        border-color: var(--theme-color);
    }

    .job-row em {
        font-style: normal;
        color: var(--green-stat-color);
    }

    .job-row em.running {
        color: var(--blue-stat-color);
    }

    .job-row em.failed {
        color: var(--red-stat-color);
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--lg-gap);
        margin-bottom: var(--vl-gap);
    }

    .stats div {
        border: 1px solid var(--sep-color);
        border-radius: 8px;
        padding: var(--lg-pad);
        background: var(--form-bg-color);
        min-width: 0;
    }

    .stats span {
        display: block;
        color: var(--secondary-text-color);
        font-size: var(--sm-font-size);
        margin-bottom: var(--sm-gap);
    }

    .stats strong {
        font-size: var(--lg-font-size);
        overflow-wrap: anywhere;
    }

    .paths,
    .calibration {
        display: grid;
        gap: var(--md-gap);
        margin-bottom: var(--vl-gap);
    }

    .calibration div {
        display: flex;
        flex-wrap: wrap;
        gap: var(--md-gap);
    }

    .calibration span {
        border: 1px dashed var(--sep-color);
        border-radius: 8px;
        padding: var(--md-pad) var(--lg-pad);
        color: var(--secondary-text-color);
    }

    .detections {
        overflow: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--sm-font-size);
    }

    th,
    td {
        border-bottom: 1px solid var(--sep-color);
        padding: var(--md-pad);
        text-align: left;
        white-space: nowrap;
    }

    @media (max-width: 1000px) {
        .job-form,
        .layout,
        .stats {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 650px) {
        .header,
        .review-head {
            flex-direction: column;
        }
    }
</style>
