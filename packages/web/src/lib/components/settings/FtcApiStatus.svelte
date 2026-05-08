<script lang="ts">
	import { onMount } from 'svelte';
	import type { ApiIndex } from '$lib/ftc-events/api';

	let status = 'checking';
	let apiIndex: ApiIndex | null = null;
	let errorMessage = '';

	onMount(async () => {
		try {
			const response = await fetch('/api/ftc/index');
			const json = await response.json();

			if (json.ok && json.data) {
				status = 'connected';
				apiIndex = json.data;
			} else {
				const error = json.error;
				if (error?.code === 'MISSING_CREDENTIALS') {
					status = 'no-credentials';
				} else if (error?.status === 401) {
					status = 'unauthorized';
				} else if (error?.status === 503) {
					status = 'unavailable';
				} else {
					status = 'error';
					errorMessage = error?.message || 'Unknown error';
				}
			}
		} catch (error) {
			status = 'error';
			errorMessage = error instanceof Error ? error.message : 'Network error';
		}
	});
</script>

<div class="ftc-api-status">
	{#if status === 'checking'}
		<div class="status checking">
			<span class="indicator">⏳</span>
			Checking FTC API connection...
		</div>
	{:else if status === 'connected'}
		<div class="status connected">
			<span class="indicator">✓</span>
			FTC API Connected
			{#if apiIndex}
				<div class="details">
					<small>Current Season: {apiIndex.currentSeason} | Max Season: {apiIndex.maxSeason}</small>
				</div>
			{/if}
		</div>
	{:else if status === 'no-credentials'}
		<div class="status no-credentials">
			<span class="indicator">⚙️</span>
			FTC API not configured. Add credentials to .env.local to use real data.
		</div>
	{:else if status === 'unauthorized'}
		<div class="status unauthorized">
			<span class="indicator">🔒</span>
			FTC API Unauthorized. Check your credentials.
		</div>
	{:else if status === 'unavailable'}
		<div class="status unavailable">
			<span class="indicator">⚠️</span>
			FTC API Service Unavailable
		</div>
	{:else}
		<div class="status error">
			<span class="indicator">❌</span>
			FTC API Error: {errorMessage}
		</div>
	{/if}
</div>

<style>
	.ftc-api-status {
		margin: 1rem 0;
	}

	.status {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.indicator {
		font-size: 1.25rem;
	}

	.status.checking {
		background: #f3f4f6;
		color: #4b5563;
	}

	.status.connected {
		background: #dcfce7;
		color: #166534;
	}

	.status.no-credentials {
		background: #fef3c7;
		color: #92400e;
	}

	.status.unauthorized {
		background: #fee2e2;
		color: #991b1b;
	}

	.status.unavailable {
		background: #fed7aa;
		color: #9a3412;
	}

	.status.error {
		background: #fecaca;
		color: #7f1d1d;
	}

	.details {
		margin-left: auto;
	}

	.details small {
		opacity: 0.9;
	}
</style>
