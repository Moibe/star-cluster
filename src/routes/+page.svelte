<script lang="ts">
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	let estilo = $state(STYLE_KEYS[0]);
	let fileInput: HTMLInputElement | undefined = $state();
	let selectedFile: File | null = $state(null);
	let dropPreview = $state('');
	let dragging = $state(false);
	let valoresParam: Record<string, string> = $state({});
	let cargando = $state(false);
	let errorMsg = $state('');
	let previewUrl = $state('');
	let archivoGuardado = $state('');

	const def = $derived(STYLES[estilo]);

	function setFile(file: File | null) {
		selectedFile = file;
		if (dropPreview) URL.revokeObjectURL(dropPreview);
		dropPreview = file ? URL.createObjectURL(file) : '';
	}

	function onFileChange(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
		setFile(file);
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
		const file = e.dataTransfer?.files?.[0];
		if (file) setFile(file);
	}
	function abrirSelector() {
		fileInput?.click();
	}
	function onDropzoneKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			abrirSelector();
		}
	}

	async function generar(e: SubmitEvent) {
		e.preventDefault();
		errorMsg = '';
		if (!selectedFile) {
			errorMsg = 'Selecciona una imagen primero.';
			return;
		}

		const form = new FormData();
		form.append('image', selectedFile);
		for (const p of def.params) {
			const v = valoresParam[p.name];
			if (v) form.append(p.name, v);
		}

		cargando = true;
		try {
			const res = await fetch(`/api/generar/${estilo}`, { method: 'POST', body: form });
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Error ${res.status}`);
			}
			archivoGuardado = res.headers.get('x-archivo') ?? '';
			const blob = await res.blob();
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = URL.createObjectURL(blob);
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Algo falló generando la imagen.';
		} finally {
			cargando = false;
		}
	}
</script>

<div class="generar">
	<h1>Generar imagen — Buzito</h1>
	<p class="hint">Sube una foto, elige un estilo y genera.</p>

	<form onsubmit={generar}>
		<label class="campo">
			<span>Imagen</span>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="dropzone"
				class:dragging
				role="button"
				tabindex="0"
				onclick={abrirSelector}
				onkeydown={onDropzoneKeydown}
				ondragover={onDragOver}
				ondragleave={onDragLeave}
				ondrop={onDrop}
			>
				{#if dropPreview}
					<img src={dropPreview} alt="Vista previa" class="dropzone-preview" />
					<span class="dropzone-filename">{selectedFile?.name}</span>
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
			<input
				type="file"
				accept="image/*"
				bind:this={fileInput}
				onchange={onFileChange}
				class="input-oculto"
			/>
		</label>

		<label class="campo">
			<span>Estilo</span>
			<select bind:value={estilo}>
				{#each STYLE_KEYS as key (key)}
					<option value={key}>{STYLES[key].label}</option>
				{/each}
			</select>
		</label>

		{#each def.params as p (p.name)}
			<label class="campo">
				<span>{p.label}</span>
				<select bind:value={valoresParam[p.name]}>
					<option value="">(default)</option>
					{#each p.options as opt (opt)}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</label>
		{/each}

		<button type="submit" disabled={cargando}>
			{cargando ? 'Generando…' : 'Generar'}
		</button>

		{#if cargando}
			<div class="progreso" role="progressbar" aria-label="Generando imagen">
				<div class="progreso-barra"></div>
			</div>
		{/if}
	</form>

	{#if errorMsg}
		<p class="error">{errorMsg}</p>
	{/if}

	{#if previewUrl}
		<div class="resultado">
			<img src={previewUrl} alt="Resultado generado" />
			{#if archivoGuardado}
				<p class="hint">Guardado como <code>{archivoGuardado}</code></p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.generar {
		max-width: 480px;
		margin: 0 auto;
		padding: 1.5rem 0;
	}
	h1 {
		font-size: 1.4rem;
		margin: 0 0 0.25rem;
	}
	.hint {
		opacity: 0.75;
		font-size: 0.85rem;
		margin: 0 0 1.25rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.campo {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}
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
	select {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;
		padding: 0.5rem 0.6rem;
		color: #fff;
		font: inherit;
	}
	/* El popup nativo del <select> lo pinta el SO con fondo blanco pase lo que pase,
	   así que las <option> necesitan su propio color oscuro (si no, heredan el blanco
	   del select y quedan invisibles salvo la fila resaltada). */
	select option {
		color: #1a1a1a;
		background: #fff;
	}
	button {
		margin-top: 0.5rem;
		background: rgba(255, 255, 255, 0.14);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.6rem 1rem;
		color: #fff;
		font: inherit;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.22);
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.progreso {
		margin-top: -0.2rem;
		height: 6px;
		border-radius: 999px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.15);
	}
	.progreso-barra {
		height: 100%;
		width: 40%;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
		animation: progreso-sweep 1.1s ease-in-out infinite;
	}
	@keyframes progreso-sweep {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(350%);
		}
	}
	.error {
		color: #ffd3d3;
		margin-top: 1rem;
	}
	.resultado {
		margin-top: 1.5rem;
	}
	.resultado img {
		max-width: 100%;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}
	.resultado code {
		font-size: 0.75rem;
		opacity: 0.8;
	}
</style>
