<script lang="ts">
	import Dropzone from '$lib/Dropzone.svelte';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	const CROP_MIN = 0; // por claridad, el offset nunca es negativo

	let estilo = $state(STYLE_KEYS[0]);
	let selectedFile: File | null = $state(null);
	let valoresParam: Record<string, string> = $state({});
	let cargando = $state(false);
	let errorMsg = $state('');
	let originalUrl = $state('');
	let generacionId = $state(0);

	// --- Recorte 1:1 interactivo ---
	let containerSize = $state(0);
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);
	let rawOffsetX: number | null = $state(null);
	let rawOffsetY: number | null = $state(null);
	let arrastrando = false;
	let dragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 };
	let guardandoRecorte = $state(false);
	let recorteGuardado = $state(false);

	const def = $derived(STYLES[estilo]);

	const escala = $derived(
		naturalWidth && naturalHeight && containerSize ? containerSize / Math.min(naturalWidth, naturalHeight) : 0
	);
	const anchoEscalado = $derived(naturalWidth * escala);
	const altoEscalado = $derived(naturalHeight * escala);
	const offsetMaxX = $derived(Math.max(0, anchoEscalado - containerSize));
	const offsetMaxY = $derived(Math.max(0, altoEscalado - containerSize));
	const offsetX = $derived(rawOffsetX === null ? offsetMaxX / 2 : Math.min(Math.max(rawOffsetX, CROP_MIN), offsetMaxX));
	const offsetY = $derived(rawOffsetY === null ? offsetMaxY / 2 : Math.min(Math.max(rawOffsetY, CROP_MIN), offsetMaxY));

	function onCropImageLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		naturalWidth = img.naturalWidth;
		naturalHeight = img.naturalHeight;
	}

	function onCropPointerDown(e: PointerEvent) {
		arrastrando = true;
		recorteGuardado = false;
		dragStart = { x: e.clientX, y: e.clientY, offsetX, offsetY };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onCropPointerMove(e: PointerEvent) {
		if (!arrastrando) return;
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;
		rawOffsetX = Math.min(Math.max(dragStart.offsetX - dx, CROP_MIN), offsetMaxX);
		rawOffsetY = Math.min(Math.max(dragStart.offsetY - dy, CROP_MIN), offsetMaxY);
	}
	async function onCropPointerUp(e: PointerEvent) {
		if (!arrastrando) return;
		arrastrando = false;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			// el pointer ya pudo haberse liberado solo (pointercancel)
		}
		await guardarRecorte();
	}

	async function guardarRecorte() {
		if (!generacionId || !escala) return;
		guardandoRecorte = true;
		try {
			const left = Math.round(offsetX / escala);
			const top = Math.round(offsetY / escala);
			const size = Math.round(containerSize / escala);
			const res = await fetch(`/api/recorte/${generacionId}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ left, top, size })
			});
			if (res.ok) recorteGuardado = true;
		} catch {
			// si esto falla no interrumpimos la vista previa, que ya se ve bien en pantalla
		} finally {
			guardandoRecorte = false;
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
			const body = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(body?.message ?? `Error ${res.status}`);
			}
			originalUrl = body.original;
			generacionId = body.id;
			naturalWidth = 0;
			naturalHeight = 0;
			rawOffsetX = null;
			rawOffsetY = null;
			recorteGuardado = false;
		} catch (err) {
			// fetch() lanza un TypeError genérico ("Failed to fetch") cuando la petición
			// ni siquiera obtiene respuesta (servidor caído, sin conexión, etc.) — se
			// distingue de los errores que sí vienen con un mensaje real del servidor.
			if (err instanceof TypeError) {
				errorMsg = 'No se pudo conectar con el servidor. ¿Sigue corriendo el dev server (npm run dev)?';
			} else {
				errorMsg = err instanceof Error ? err.message : 'Algo falló generando la imagen.';
			}
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
			<Dropzone bind:file={selectedFile} />
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

	{#if originalUrl}
		<div class="resultado">
			<div class="resultado-item">
				<p class="resultado-label">Original</p>
				<img src={originalUrl} alt="Resultado original" />
			</div>
			<div class="resultado-item">
				<p class="resultado-label">1:1 — arrastra para ajustar</p>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="crop-box"
					bind:clientWidth={containerSize}
					onpointerdown={onCropPointerDown}
					onpointermove={onCropPointerMove}
					onpointerup={onCropPointerUp}
					onpointercancel={onCropPointerUp}
				>
					<img
						src={originalUrl}
						alt="Ajusta el recorte 1:1"
						class="crop-img"
						style="width:{anchoEscalado}px; height:{altoEscalado}px; left:{-offsetX}px; top:{-offsetY}px;"
						onload={onCropImageLoad}
						draggable="false"
					/>
				</div>
				{#if guardandoRecorte}
					<p class="hint">Guardando…</p>
				{:else if recorteGuardado}
					<p class="hint">Guardado ✓</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.generar {
		max-width: 640px;
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
		margin: 0.35rem 0 0;
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
		display: flex;
		gap: 1.25rem;
		flex-wrap: wrap;
		align-items: flex-start;
	}
	.resultado-item {
		flex: 1;
		min-width: 220px;
	}
	.resultado-label {
		font-size: 0.8rem;
		opacity: 0.75;
		margin: 0 0 0.35rem;
	}
	.resultado > .resultado-item > img {
		max-width: 100%;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		display: block;
	}
	.crop-box {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(0, 0, 0, 0.15);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}
	.crop-box:active {
		cursor: grabbing;
	}
	.crop-img {
		position: absolute;
		max-width: none;
		pointer-events: none;
	}
</style>
