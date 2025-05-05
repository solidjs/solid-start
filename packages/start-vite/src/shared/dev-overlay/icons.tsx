// @refresh skip
import type { JSX } from 'solid-js';

export function ArrowRightIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}

export function ArrowLeftIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

export function RefreshIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export function ViewCompiledIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

export function ViewOriginalIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export function CameraIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      stroke="none"
      {...props}
    >
      <title>{props.title}</title>
      <path 
        d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z"
      />
      <path
        fill-rule="evenodd"
        d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        clip-rule="evenodd"
      />
    </svg>
  );
}


export function DiscordIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      stroke="none"
      {...props}
    >
      <title>{props.title}</title>
      <path d="M14.82 4.26a10.14 10.14 0 0 0-.53 1.1 14.66 14.66 0 0 0-4.58 0 10.14 10.14 0 0 0-.53-1.1 16 16 0 0 0-4.13 1.3 17.33 17.33 0 0 0-3 11.59 16.6 16.6 0 0 0 5.07 2.59A12.89 12.89 0 0 0 8.23 18a9.65 9.65 0 0 1-1.71-.83 3.39 3.39 0 0 0 .42-.33 11.66 11.66 0 0 0 10.12 0q.21.18.42.33a10.84 10.84 0 0 1-1.71.84 12.41 12.41 0 0 0 1.08 1.78 16.44 16.44 0 0 0 5.06-2.59 17.22 17.22 0 0 0-3-11.59 16.09 16.09 0 0 0-4.09-1.35zM8.68 14.81a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.93 1.93 0 0 1 1.8 2 1.93 1.93 0 0 1-1.8 2zm6.64 0a1.94 1.94 0 0 1-1.8-2 1.93 1.93 0 0 1 1.8-2 1.92 1.92 0 0 1 1.8 2 1.92 1.92 0 0 1-1.8 2z"></path>
    </svg>
  );
}

export function GithubIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      stroke="none"
      {...props}
    >
      <title>{props.title}</title>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"></path>
    </svg>
  );
}

export function SolidStartIcon(
  props: JSX.IntrinsicElements['svg'] & { title: string },
): JSX.Element {
  return (
    <svg
      viewBox="0 0 701 701"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{props.title}</title>
      <g filter="url(#filter0_d_1_2)">
      <rect width="693" height="693" transform="translate(4)" fill="white"/>
      <mask id="mask0_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="323" y="556" width="174" height="72">
      <path d="M323.508 627.978L435.81 619.384C435.81 619.384 474.315 613.168 496.842 576.082L417.413 556.809L323.508 627.978Z" fill="white"/>
      </mask>
      <g mask="url(#mask0_1_2)">
      <path d="M510.734 559.645L490 661.769L309.658 625.183L330.349 523.018L510.734 559.645Z" fill="url(#paint0_linear_1_2)"/>
      </g>
      <mask id="mask1_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="73" y="364" width="424" height="220">
      <path d="M168.488 364.785C135.031 366.371 73.2477 372.295 73.2477 372.295L342.489 567.989L403.813 583.341L496.884 576.124L225.974 380.096C225.974 380.096 204.072 364.66 172.91 364.66C171.491 364.66 169.989 364.702 168.488 364.785Z" fill="white"/>
      </mask>
      <g mask="url(#mask1_1_2)">
      <path d="M192.016 773.57L-24.954 425.942L378.115 174.389L595.085 522.017L192.016 773.57Z" fill="url(#paint1_linear_1_2)"/>
      </g>
      <mask id="mask2_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="515" y="255" width="179" height="71">
      <path d="M515.573 325.822L631.254 318.688C631.254 318.688 670.885 312.931 693.621 275.928L611.438 255.487L515.573 325.822Z" fill="white"/>
      </mask>
      <g mask="url(#mask2_1_2)">
      <path d="M557.832 401.58L485.62 272.174L651.32 179.729L723.532 309.135L557.832 401.58Z" fill="url(#paint2_linear_1_2)"/>
      </g>
      <mask id="mask3_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="254" y="59" width="440" height="223">
      <path d="M352.251 59.0417C317.751 60.1681 254.132 65.2993 254.132 65.2993L534.345 265.666L597.755 281.936L693.621 275.928L411.697 75.2279C411.697 75.2279 388.294 59 355.505 59C354.42 59 353.335 59 352.251 59.0417Z" fill="white"/>
      </mask>
      <g mask="url(#mask3_1_2)">
      <path d="M623.161 -102.236L775.386 246.226L324.592 443.172L172.325 94.7097L623.161 -102.236Z" fill="url(#paint3_linear_1_2)"/>
      </g>
      <mask id="mask4_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="6" y="371" width="396" height="257">
      <path d="M6.62575 415.555C6.41717 415.889 6.20858 416.264 6 416.64L79.6305 469.912L153.261 523.185L275.909 611.917C317.125 641.744 373.318 628.895 401.393 583.215L326.762 529.234L252.13 475.252L130.483 387.229C115.632 376.508 98.8203 371.377 82.1335 371.377C53.0567 371.335 24.272 386.895 6.62575 415.555Z" fill="white"/>
      </mask>
      <g mask="url(#mask4_1_2)">
      <path d="M529.756 464.03L265.855 829.387L-122.321 549.008L141.538 183.65L529.756 464.03Z" fill="url(#paint4_linear_1_2)"/>
      </g>
      <mask id="mask5_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="187" y="64" width="411" height="263">
      <path d="M188.47 108.101C188.261 108.476 188.053 108.81 187.844 109.186L264.478 163.751L341.112 218.317L468.725 309.177C511.61 339.714 569.388 327.532 597.755 281.977L520.078 226.661L442.401 171.386L315.832 81.2352C300.063 70.0133 282.25 64.6318 264.645 64.6318C235.026 64.6318 206.074 79.9002 188.47 108.101Z" fill="white"/>
      </mask>
      <g mask="url(#mask5_1_2)">
      <path d="M685.945 96.6704L550.031 471.164L99.6544 307.675L235.527 -66.8184L685.945 96.6704Z" fill="url(#paint5_linear_1_2)"/>
      </g>
      <mask id="mask6_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="134" y="164" width="419" height="344">
      <path d="M134.363 170.051L233.149 278.64C237.571 284.856 242.744 290.571 248.626 295.66L441.567 507.791L537.432 501.784C565.8 456.229 554.036 394.53 511.151 363.993L383.539 273.133L306.863 218.567L230.229 164.002L134.363 170.051Z" fill="white"/>
      </mask>
      <g mask="url(#mask6_1_2)">
      <path d="M291.886 715.5L-31.1699 289.528L408.235 -43.7072L731.291 382.265L291.886 715.5Z" fill="url(#paint6_linear_1_2)"/>
      </g>
      <mask id="mask7_1_2" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="118" y="170" width="340" height="338">
      <path d="M133.696 171.094C105.703 216.065 117.301 276.971 159.644 307.091L286.255 397.241L363.932 452.516L441.609 507.791C469.976 462.236 458.212 400.537 415.327 370L287.631 279.141L210.997 224.575L134.363 170.051C134.154 170.384 133.904 170.718 133.696 171.094Z" fill="white"/>
      </mask>
      <g mask="url(#mask7_1_2)">
      <path d="M606.057 239.009L395.553 654.635L-30.4607 438.833L180.043 23.2069L606.057 239.009Z" fill="url(#paint7_linear_1_2)"/>
      </g>
      </g>
      <defs>
      <filter id="filter0_d_1_2" x="0" y="0" width="701" height="701" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="4"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_2"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_2" result="shape"/>
      </filter>
      <linearGradient id="paint0_linear_1_2" x1="522.269" y1="40.5341" x2="374.272" y2="769.949" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1593F5"/>
      <stop offset="1" stop-color="#0084CE"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1_2" x1="507.729" y1="830.625" x2="-112.45" y2="-163.072" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1593F5"/>
      <stop offset="1" stop-color="#0084CE"/>
      </linearGradient>
      <linearGradient id="paint2_linear_1_2" x1="915.255" y1="847.35" x2="541.738" y2="177.838" gradientUnits="userSpaceOnUse">
      <stop stop-color="white"/>
      <stop offset="1" stop-color="#15ABFF"/>
      </linearGradient>
      <linearGradient id="paint3_linear_1_2" x1="254.189" y1="-332.587" x2="571.326" y2="393.304" gradientUnits="userSpaceOnUse">
      <stop stop-color="white"/>
      <stop offset="1" stop-color="#79CFFF"/>
      </linearGradient>
      <linearGradient id="paint4_linear_1_2" x1="610.213" y1="-56.2573" x2="106.317" y2="641.444" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0057E5"/>
      <stop offset="1" stop-color="#0084CE"/>
      </linearGradient>
      <linearGradient id="paint5_linear_1_2" x1="496.212" y1="-82.6564" x2="337.643" y2="354.288" gradientUnits="userSpaceOnUse">
      <stop stop-color="white"/>
      <stop offset="1" stop-color="#15ABFF"/>
      </linearGradient>
      <linearGradient id="paint6_linear_1_2" x1="693.692" y1="789.133" x2="-102.675" y2="-260.944" gradientUnits="userSpaceOnUse">
      <stop stop-color="white"/>
      <stop offset="1" stop-color="#79CFFF"/>
      </linearGradient>
      <linearGradient id="paint7_linear_1_2" x1="555.118" y1="-188.777" x2="146.363" y2="618.161" gradientUnits="userSpaceOnUse">
      <stop stop-color="white"/>
      <stop offset="1" stop-color="#79CFFF"/>
      </linearGradient>
      </defs>
    </svg>
  );
}

