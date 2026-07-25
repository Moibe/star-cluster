<script lang="ts">
	let { file = $bindable(null) }: { file?: File | null } = $props();

	let fileInput: HTMLInputElement | undefined = $state();
	let previewUrl = $state('');
	let dragging = $state(false);

	function setFile(f: File | null) {
		file = f;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = f ? URL.createObjectURL(f) : '';
	}

	function onFileChange(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
		setFile(f);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}
	function onDragLeave() {
		dragging = false;
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) setFile(f);
	}
	function abrirSelector() {
		fileInput?.click();
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			abrirSelector();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="dropzone"
	class:dragging
	role="button"
	tabindex="0"
	onclick={abrirSelector}
	onkeydown={onKeydown}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	{#if previewUrl}
		<img src={previewUrl} alt="Vista previa" class="dropzone-preview" />
		<span class="dropzone-filename">{file?.name}</span>
	{:else}
		<span class="dropzone-icon" aria-hidden="true">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 16V4M12 4l-4 4M12 4l4 4" />
				<path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
			</svg>
		</span>
		<span>Arrastra una imagen aquí o haz clic para elegir</span>
	{/if}
</div>
<input type="file" accept="image/*" bind:this={fileInput} onchange={onFileChange} class="input-oculto" />

<style>
	.input-oculto {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	.dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 140px;
		padding: 1rem;
		text-align: center;
		background: rgba(255, 255, 255, 0.08);
		border: 2px dashed rgba(255, 255, 255, 0.35);
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
	}
	.dropzone:hover {
		background: rgba(255, 255, 255, 0.13);
		border-color: rgba(255, 255, 255, 0.55);
	}
	.dropzone.dragging {
		background: rgba(255, 255, 255, 0.2);
		border-color: #fff;
	}
	.dropzone-icon {
		opacity: 0.8;
	}
	.dropzone-preview {
		max-width: 100%;
		max-height: 160px;
		border-radius: 8px;
	}
	.dropzone-filename {
		font-size: 0.8rem;
		opacity: 0.85;
		word-break: break-all;
	}
</style>
