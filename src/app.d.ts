/// <reference types="svelte" />
/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			isAdmin: boolean;
		}
		interface PageData {
			user: User | null;
			isAdmin: boolean;
		}
		interface PageState {
			[key: string]: any;
		}
		// interface Platform {}
	}
}

export {};

// SvelteKit module declarations
declare module '$app/navigation' {
	export function goto(
		url: string | URL,
		opts?: {
			replaceState?: boolean;
			noScroll?: boolean;
			keepFocus?: boolean;
			invalidateAll?: boolean;
			state?: App.PageState;
		}
	): Promise<void>;
	
	export function invalidate(path: string): Promise<void>;
	export function invalidateAll(): Promise<void>;
}

declare module '$app/stores' {
	import { type Readable } from 'svelte/store';
	
	interface Page {
		url: URL;
		params: Record<string, string>;
		state: App.PageState;
		status: number;
		error: Error | null;
		data: Record<string, any>;
		form: Record<string, any> | null;
	}
	
	export const page: Readable<Page>;
	export const navigating: Readable<{
		from: {
			url: URL;
			params: Record<string, string>;
		} | null;
		to: {
			url: URL;
			params: Record<string, string>;
		} | null;
	} | null>;
}

declare module 'svelte' {
	export function onMount(callback: () => void | (() => void)): void;
}

// Svelte HTML element declarations
declare namespace svelteHTML {
  interface IntrinsicElements {
    // HTML
    a: HTMLProps<HTMLAnchorElement>;
    abbr: HTMLProps<HTMLElement>;
    address: HTMLProps<HTMLElement>;
    area: HTMLProps<HTMLAreaElement>;
    article: HTMLProps<HTMLElement>;
    aside: HTMLProps<HTMLElement>;
    audio: HTMLProps<HTMLAudioElement>;
    b: HTMLProps<HTMLElement>;
    base: HTMLProps<HTMLBaseElement>;
    bdi: HTMLProps<HTMLElement>;
    bdo: HTMLProps<HTMLElement>;
    big: HTMLProps<HTMLElement>;
    blockquote: HTMLProps<HTMLQuoteElement>;
    body: HTMLProps<HTMLBodyElement>;
    br: HTMLProps<HTMLBRElement>;
    button: HTMLProps<HTMLButtonElement>;
    canvas: HTMLProps<HTMLCanvasElement>;
    caption: HTMLProps<HTMLTableCaptionElement>;
    cite: HTMLProps<HTMLElement>;
    code: HTMLProps<HTMLElement>;
    col: HTMLProps<HTMLTableColElement>;
    colgroup: HTMLProps<HTMLTableColElement>;
    data: HTMLProps<HTMLDataElement>;
    datalist: HTMLProps<HTMLDataListElement>;
    dd: HTMLProps<HTMLElement>;
    del: HTMLProps<HTMLModElement>;
    details: HTMLProps<HTMLDetailsElement>;
    dfn: HTMLProps<HTMLElement>;
    dialog: HTMLProps<HTMLDialogElement>;
    div: HTMLProps<HTMLDivElement>;
    dl: HTMLProps<HTMLDListElement>;
    dt: HTMLProps<HTMLElement>;
    em: HTMLProps<HTMLElement>;
    embed: HTMLProps<HTMLEmbedElement>;
    fieldset: HTMLProps<HTMLFieldSetElement>;
    figcaption: HTMLProps<HTMLElement>;
    figure: HTMLProps<HTMLElement>;
    footer: HTMLProps<HTMLElement>;
    form: HTMLProps<HTMLFormElement>;
    h1: HTMLProps<HTMLHeadingElement>;
    h2: HTMLProps<HTMLHeadingElement>;
    h3: HTMLProps<HTMLHeadingElement>;
    h4: HTMLProps<HTMLHeadingElement>;
    h5: HTMLProps<HTMLHeadingElement>;
    h6: HTMLProps<HTMLHeadingElement>;
    head: HTMLProps<HTMLHeadElement>;
    header: HTMLProps<HTMLElement>;
    hgroup: HTMLProps<HTMLElement>;
    hr: HTMLProps<HTMLHRElement>;
    html: HTMLProps<HTMLHtmlElement>;
    i: HTMLProps<HTMLElement>;
    iframe: HTMLProps<HTMLIFrameElement>;
    img: HTMLProps<HTMLImageElement>;
    input: HTMLProps<HTMLInputElement>;
    ins: HTMLProps<HTMLModElement>;
    kbd: HTMLProps<HTMLElement>;
    keygen: HTMLProps<HTMLElement>;
    label: HTMLProps<HTMLLabelElement>;
    legend: HTMLProps<HTMLLegendElement>;
    li: HTMLProps<HTMLLIElement>;
    link: HTMLProps<HTMLLinkElement>;
    main: HTMLProps<HTMLElement>;
    map: HTMLProps<HTMLMapElement>;
    mark: HTMLProps<HTMLElement>;
    menu: HTMLProps<HTMLMenuElement>;
    menuitem: HTMLProps<HTMLElement>;
    meta: HTMLProps<HTMLMetaElement>;
    meter: HTMLProps<HTMLMeterElement>;
    nav: HTMLProps<HTMLElement>;
    noscript: HTMLProps<HTMLElement>;
    object: HTMLProps<HTMLObjectElement>;
    ol: HTMLProps<HTMLOListElement>;
    optgroup: HTMLProps<HTMLOptGroupElement>;
    option: HTMLProps<HTMLOptionElement>;
    output: HTMLProps<HTMLOutputElement>;
    p: HTMLProps<HTMLParagraphElement>;
    param: HTMLProps<HTMLParamElement>;
    picture: HTMLProps<HTMLElement>;
    pre: HTMLProps<HTMLPreElement>;
    progress: HTMLProps<HTMLProgressElement>;
    q: HTMLProps<HTMLQuoteElement>;
    rp: HTMLProps<HTMLElement>;
    rt: HTMLProps<HTMLElement>;
    ruby: HTMLProps<HTMLElement>;
    s: HTMLProps<HTMLElement>;
    samp: HTMLProps<HTMLElement>;
    script: HTMLProps<HTMLScriptElement>;
    section: HTMLProps<HTMLElement>;
    select: HTMLProps<HTMLSelectElement>;
    slot: HTMLProps<HTMLSlotElement>;
    small: HTMLProps<HTMLElement>;
    source: HTMLProps<HTMLSourceElement>;
    span: HTMLProps<HTMLSpanElement>;
    strong: HTMLProps<HTMLElement>;
    style: HTMLProps<HTMLStyleElement>;
    sub: HTMLProps<HTMLElement>;
    summary: HTMLProps<HTMLElement>;
    sup: HTMLProps<HTMLElement>;
    table: HTMLProps<HTMLTableElement>;
    tbody: HTMLProps<HTMLTableSectionElement>;
    td: HTMLProps<HTMLTableDataCellElement>;
    textarea: HTMLProps<HTMLTextAreaElement>;
    tfoot: HTMLProps<HTMLTableSectionElement>;
    th: HTMLProps<HTMLTableHeaderCellElement>;
    thead: HTMLProps<HTMLTableSectionElement>;
    time: HTMLProps<HTMLTimeElement>;
    title: HTMLProps<HTMLTitleElement>;
    tr: HTMLProps<HTMLTableRowElement>;
    track: HTMLProps<HTMLTrackElement>;
    u: HTMLProps<HTMLElement>;
    ul: HTMLProps<HTMLUListElement>;
    var: HTMLProps<HTMLElement>;
    video: HTMLProps<HTMLVideoElement>;
    wbr: HTMLProps<HTMLElement>;

    // SVG
    svg: SVGProps<SVGSVGElement>;
    animate: SVGProps<SVGElement>;
    circle: SVGProps<SVGCircleElement>;
    clipPath: SVGProps<SVGClipPathElement>;
    defs: SVGProps<SVGDefsElement>;
    desc: SVGProps<SVGDescElement>;
    ellipse: SVGProps<SVGEllipseElement>;
    feBlend: SVGProps<SVGFEBlendElement>;
    feColorMatrix: SVGProps<SVGFEColorMatrixElement>;
    feComponentTransfer: SVGProps<SVGFEComponentTransferElement>;
    feComposite: SVGProps<SVGFECompositeElement>;
    feConvolveMatrix: SVGProps<SVGFEConvolveMatrixElement>;
    feDiffuseLighting: SVGProps<SVGFEDiffuseLightingElement>;
    feDisplacementMap: SVGProps<SVGFEDisplacementMapElement>;
    feDistantLight: SVGProps<SVGFEDistantLightElement>;
    feFlood: SVGProps<SVGFEFloodElement>;
    feFuncA: SVGProps<SVGFEFuncAElement>;
    feFuncB: SVGProps<SVGFEFuncBElement>;
    feFuncG: SVGProps<SVGFEFuncGElement>;
    feFuncR: SVGProps<SVGFEFuncRElement>;
    feGaussianBlur: SVGProps<SVGFEGaussianBlurElement>;
    feImage: SVGProps<SVGFEImageElement>;
    feMerge: SVGProps<SVGFEMergeElement>;
    feMergeNode: SVGProps<SVGFEMergeNodeElement>;
    feMorphology: SVGProps<SVGFEMorphologyElement>;
    feOffset: SVGProps<SVGFEOffsetElement>;
    fePointLight: SVGProps<SVGFEPointLightElement>;
    feSpecularLighting: SVGProps<SVGFESpecularLightingElement>;
    feSpotLight: SVGProps<SVGFESpotLightElement>;
    feTile: SVGProps<SVGFETileElement>;
    feTurbulence: SVGProps<SVGFETurbulenceElement>;
    filter: SVGProps<SVGFilterElement>;
    foreignObject: SVGProps<SVGForeignObjectElement>;
    g: SVGProps<SVGGElement>;
    image: SVGProps<SVGImageElement>;
    line: SVGProps<SVGLineElement>;
    linearGradient: SVGProps<SVGLinearGradientElement>;
    marker: SVGProps<SVGMarkerElement>;
    mask: SVGProps<SVGMaskElement>;
    path: SVGProps<SVGPathElement>;
    pattern: SVGProps<SVGPatternElement>;
    polygon: SVGProps<SVGPolygonElement>;
    polyline: SVGProps<SVGPolylineElement>;
    radialGradient: SVGProps<SVGRadialGradientElement>;
    rect: SVGProps<SVGRectElement>;
    stop: SVGProps<SVGStopElement>;
    symbol: SVGProps<SVGSymbolElement>;
    text: SVGProps<SVGTextElement>;
    textPath: SVGProps<SVGTextPathElement>;
    tspan: SVGProps<SVGTSpanElement>;
    use: SVGProps<SVGUseElement>;
    view: SVGProps<SVGViewElement>;
  }

  interface HTMLProps<T extends EventTarget> extends HTMLAttributes<T> {}
  
  interface SVGProps<T extends EventTarget> extends SVGAttributes<T> {}
  
  interface HTMLAttributes<T> {
    // Standard HTML Attributes
    accesskey?: string;
    class?: string;
    contenteditable?: boolean | 'true' | 'false';
    contextmenu?: string;
    dir?: string;
    draggable?: boolean | 'true' | 'false';
    hidden?: boolean;
    id?: string;
    lang?: string;
    slot?: string;
    spellcheck?: boolean | 'true' | 'false';
    style?: string;
    tabindex?: number | string;
    title?: string;
    
    // Svelte specific attributes
    // Event handlers
    'on:click'?: (event: CustomEvent<any> | MouseEvent) => void;
    'on:change'?: (event: CustomEvent<any> | Event) => void;
    'on:input'?: (event: CustomEvent<any> | InputEvent) => void;
    'on:focus'?: (event: CustomEvent<any> | FocusEvent) => void;
    'on:blur'?: (event: CustomEvent<any> | FocusEvent) => void;
    'on:keydown'?: (event: CustomEvent<any> | KeyboardEvent) => void;
    'on:keyup'?: (event: CustomEvent<any> | KeyboardEvent) => void;
    'on:mouseenter'?: (event: CustomEvent<any> | MouseEvent) => void;
    'on:mouseleave'?: (event: CustomEvent<any> | MouseEvent) => void;
    'on:submit'?: (event: CustomEvent<any> | SubmitEvent) => void;
    'on:submit|preventDefault'?: (event: CustomEvent<any> | SubmitEvent) => void;
    
    // Class directives
    'class:active'?: boolean;
    'class:selected'?: boolean;
    'class:disabled'?: boolean;
    'class:open'?: boolean;
    'class:focus'?: boolean;
    'class:hover'?: boolean;
    'class:font-bold'?: boolean;
    [k: `class:${string}`]: boolean;
    
    // Bind directives
    'bind:value'?: any;
    'bind:checked'?: boolean;
    'bind:group'?: any;
    'bind:this'?: any;
    [k: `bind:${string}`]: any;
    
    // Other Svelte directives
    'use:action'?: any;
    'transition:fade'?: any;
    'in:fade'?: any;
    'out:fade'?: any;
    
    // Allow arbitrary attributes
    [k: string]: any;
  }
  
  interface SVGAttributes<T> {
    // SVG Attributes
    accentHeight?: number | string;
    accumulate?: 'none' | 'sum';
    additive?: 'replace' | 'sum';
    alignmentBaseline?: 'auto' | 'baseline' | 'before-edge' | 'text-before-edge' | 'middle' | 'central' | 'after-edge' | 'text-after-edge' | 'ideographic' | 'alphabetic' | 'hanging' | 'mathematical' | 'inherit';
    allowReorder?: 'no' | 'yes';
    alphabetic?: number | string;
    amplitude?: number | string;
    arabicForm?: 'initial' | 'medial' | 'terminal' | 'isolated';
    ascent?: number | string;
    attributeName?: string;
    attributeType?: string;
    autoReverse?: number | string;
    azimuth?: number | string;
    baseFrequency?: number | string;
    baselineShift?: number | string;
    baseProfile?: number | string;
    bbox?: number | string;
    begin?: number | string;
    bias?: number | string;
    by?: number | string;
    calcMode?: number | string;
    capHeight?: number | string;
    clip?: number | string;
    clipPath?: string;
    clipPathUnits?: number | string;
    clipRule?: number | string;
    colorInterpolation?: number | string;
    colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
    colorProfile?: number | string;
    colorRendering?: number | string;
    contentScriptType?: number | string;
    contentStyleType?: number | string;
    cursor?: number | string;
    cx?: number | string;
    cy?: number | string;
    d?: string;
    decelerate?: number | string;
    descent?: number | string;
    diffuseConstant?: number | string;
    direction?: number | string;
    display?: number | string;
    divisor?: number | string;
    dominantBaseline?: number | string;
    dur?: number | string;
    dx?: number | string;
    dy?: number | string;
    edgeMode?: number | string;
    elevation?: number | string;
    enableBackground?: number | string;
    end?: number | string;
    exponent?: number | string;
    externalResourcesRequired?: number | string;
    fill?: string;
    fillOpacity?: number | string;
    fillRule?: 'nonzero' | 'evenodd' | 'inherit';
    filter?: string;
    filterRes?: number | string;
    filterUnits?: number | string;
    floodColor?: number | string;
    floodOpacity?: number | string;
    focusable?: number | string;
    fontFamily?: string;
    fontSize?: number | string;
    fontSizeAdjust?: number | string;
    fontStretch?: number | string;
    fontStyle?: number | string;
    fontVariant?: number | string;
    fontWeight?: number | string;
    format?: number | string;
    from?: number | string;
    fx?: number | string;
    fy?: number | string;
    g1?: number | string;
    g2?: number | string;
    glyphName?: number | string;
    glyphOrientationHorizontal?: number | string;
    glyphOrientationVertical?: number | string;
    glyphRef?: number | string;
    gradientTransform?: string;
    gradientUnits?: string;
    hanging?: number | string;
    horizAdvX?: number | string;
    horizOriginX?: number | string;
    href?: string;
    ideographic?: number | string;
    imageRendering?: number | string;
    in2?: number | string;
    in?: string;
    intercept?: number | string;
    k1?: number | string;
    k2?: number | string;
    k3?: number | string;
    k4?: number | string;
    k?: number | string;
    kernelMatrix?: number | string;
    kernelUnitLength?: number | string;
    kerning?: number | string;
    keyPoints?: number | string;
    keySplines?: number | string;
    keyTimes?: number | string;
    lengthAdjust?: number | string;
    letterSpacing?: number | string;
    lightingColor?: number | string;
    limitingConeAngle?: number | string;
    local?: number | string;
    markerEnd?: string;
    markerHeight?: number | string;
    markerMid?: string;
    markerStart?: string;
    markerUnits?: number | string;
    markerWidth?: number | string;
    mask?: string;
    maskContentUnits?: number | string;
    maskUnits?: number | string;
    mathematical?: number | string;
    mode?: number | string;
    numOctaves?: number | string;
    offset?: number | string;
    opacity?: number | string;
    operator?: number | string;
    order?: number | string;
    orient?: number | string;
    orientation?: number | string;
    origin?: number | string;
    overflow?: number | string;
    overlinePosition?: number | string;
    overlineThickness?: number | string;
    paintOrder?: number | string;
    panose1?: number | string;
    pathLength?: number | string;
    patternContentUnits?: string;
    patternTransform?: number | string;
    patternUnits?: string;
    pointerEvents?: number | string;
    points?: string;
    pointsAtX?: number | string;
    pointsAtY?: number | string;
    pointsAtZ?: number | string;
    preserveAlpha?: number | string;
    preserveAspectRatio?: string;
    primitiveUnits?: number | string;
    r?: number | string;
    radius?: number | string;
    refX?: number | string;
    refY?: number | string;
    renderingIntent?: number | string;
    repeatCount?: number | string;
    repeatDur?: number | string;
    requiredExtensions?: number | string;
    requiredFeatures?: number | string;
    restart?: number | string;
    result?: string;
    rotate?: number | string;
    rx?: number | string;
    ry?: number | string;
    scale?: number | string;
    seed?: number | string;
    shapeRendering?: number | string;
    slope?: number | string;
    spacing?: number | string;
    specularConstant?: number | string;
    specularExponent?: number | string;
    speed?: number | string;
    spreadMethod?: string;
    startOffset?: number | string;
    stdDeviation?: number | string;
    stemh?: number | string;
    stemv?: number | string;
    stitchTiles?: number | string;
    stopColor?: string;
    stopOpacity?: number | string;
    strikethroughPosition?: number | string;
    strikethroughThickness?: number | string;
    string?: number | string;
    stroke?: string;
    strokeDasharray?: string | number;
    strokeDashoffset?: string | number;
    strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
    strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
    strokeMiterlimit?: string | number;
    strokeOpacity?: number | string;
    strokeWidth?: number | string;
    surfaceScale?: number | string;
    systemLanguage?: number | string;
    tableValues?: number | string;
    targetX?: number | string;
    targetY?: number | string;
    textAnchor?: string;
    textDecoration?: number | string;
    textLength?: number | string;
    textRendering?: number | string;
    to?: number | string;
    transform?: string;
    u1?: number | string;
    u2?: number | string;
    underlinePosition?: number | string;
    underlineThickness?: number | string;
    unicode?: number | string;
    unicodeBidi?: number | string;
    unicodeRange?: number | string;
    unitsPerEm?: number | string;
    vAlphabetic?: number | string;
    values?: string;
    vectorEffect?: number | string;
    version?: string;
    vertAdvY?: number | string;
    vertOriginX?: number | string;
    vertOriginY?: number | string;
    vHanging?: number | string;
    vIdeographic?: number | string;
    viewBox?: string;
    viewTarget?: number | string;
    visibility?: number | string;
    vMathematical?: number | string;
    widths?: number | string;
    wordSpacing?: number | string;
    writingMode?: number | string;
    x1?: number | string;
    x2?: number | string;
    x?: number | string;
    xChannelSelector?: string;
    xHeight?: number | string;
    xlinkActuate?: string;
    xlinkArcrole?: string;
    xlinkHref?: string;
    xlinkRole?: string;
    xlinkShow?: string;
    xlinkTitle?: string;
    xlinkType?: string;
    xmlBase?: string;
    xmlLang?: string;
    xmlns?: string;
    xmlnsXlink?: string;
    xmlSpace?: string;
    y1?: number | string;
    y2?: number | string;
    y?: number | string;
    yChannelSelector?: string;
    z?: number | string;
    zoomAndPan?: string;
    
    // Svelte event handlers, etc.
    'on:click'?: (event: CustomEvent<any> | MouseEvent) => void;
    // Add other Svelte specific attributes as needed
    [key: string]: any;
  }
}
