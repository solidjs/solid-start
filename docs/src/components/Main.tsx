export function Main(props) {
  return (
    <div class="flex flex-1 w-full h-full self-stretch">
      <div class="w-full min-w-0">
        <main class="flex flex-1 self-stretch flex-col items-end justify-around">
          <article class="h-full mx-auto relative w-full min-w-0">
            <div class="lg:pt-0 pt-20 pl-0 lg:pl-80 2xl:px-80 ">
              <div class="px-5 sm:px-12 pt-5">
                <div class="max-w-4xl ml-0 2xl:mx-auto">{props.children}</div>
              </div>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
import { Title as MetaTitle } from "solid-meta";

export function Title(props) {
  return (
    <h1 class="heading mt-0 text-primary dark:text-primary-dark -mx-.5 break-words text-5xl font-bold leading-tight">
      {props.children}
      <MetaTitle>{props.children}</MetaTitle>
      <a
        href="#undefined"
        aria-label="Link for this heading"
        title="Link for this heading"
        class="jsx-1906412371 anchor hidden"
      >
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 13 13"
          xmlns="http://www.w3.org/2000/svg"
          class="jsx-1906412371 text-gray-70 ml-2 h-5 w-5"
        >
          <g fill="currentColor" fill-rule="evenodd" class="jsx-1906412371">
            <path
              d="M7.778 7.975a2.5 2.5 0 0 0 .347-3.837L6.017 2.03a2.498 2.498 0 0 0-3.542-.007 2.5 2.5 0 0 0 .006 3.543l1.153 1.15c.07-.29.154-.563.25-.773.036-.077.084-.16.14-.25L3.18 4.85a1.496 1.496 0 0 1 .002-2.12 1.496 1.496 0 0 1 2.12 0l2.124 2.123a1.496 1.496 0 0 1-.333 2.37c.16.246.42.504.685.752z"
              class="jsx-1906412371"
            ></path>
            <path
              d="M5.657 4.557a2.5 2.5 0 0 0-.347 3.837l2.108 2.108a2.498 2.498 0 0 0 3.542.007 2.5 2.5 0 0 0-.006-3.543L9.802 5.815c-.07.29-.154.565-.25.774-.036.076-.084.16-.14.25l.842.84c.585.587.59 1.532 0 2.122-.587.585-1.532.59-2.12 0L6.008 7.68a1.496 1.496 0 0 1 .332-2.372c-.16-.245-.42-.503-.685-.75z"
              class="jsx-1906412371"
            ></path>
          </g>
        </svg>
      </a>
    </h1>
  );
}

export function DocsSectionLink() {
  return (
    <div class="flex mb-3 mt-0.5 items-center">
      <a
        class="text-link dark:text-link-dark text-sm tracking-wide font-bold uppercase mr-1 hover:underline"
        href="/apis"
      >
        API Reference
      </a>
      <span class="inline-block mr-1 text-link dark:text-link-dark text-lg">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.86612 13.6161C6.37796 14.1043 6.37796 14.8957 6.86612 15.3839C7.35427 15.872 8.14572 15.872 8.63388 15.3839L13.1339 10.8839C13.622 10.3957 13.622 9.60428 13.1339 9.11612L8.63388 4.61612C8.14572 4.12797 7.35427 4.12797 6.86612 4.61612C6.37796 5.10428 6.37796 5.89573 6.86612 6.38388L10.4822 10L6.86612 13.6161Z"
            fill="currentColor"
          ></path>
        </svg>
      </span>
    </div>
  );
}

function OnThisPage() {
  return (
    <div class="w-full lg:max-w-xs hidden 2xl:block">
      <nav
        role="navigation"
        class="jsx-3298f0cd3a6d0a22 pt-6 fixed top-10 right-0"
        style="width: inherit; max-width: inherit;"
      >
        <h2 class="jsx-3298f0cd3a6d0a22 mb-3 lg:mb-3 uppercase tracking-wide font-bold text-sm text-secondary dark:text-secondary-dark px-4 w-full">
          On this page
        </h2>
        <div class="jsx-3298f0cd3a6d0a22 toc h-full overflow-y-auto pl-4">
          <ul class="jsx-3298f0cd3a6d0a22 space-y-2 pb-16">
            <li class="jsx-3298f0cd3a6d0a22 text-sm px-2 rounded-l-lg bg-highlight dark:bg-highlight-dark">
              <a
                href="#"
                class="jsx-3298f0cd3a6d0a22 text-link dark:text-link-dark font-bold block hover:text-link dark:hover:text-link-dark leading-normal py-2"
              >
                Overview
              </a>
            </li>
            <li class="jsx-3298f0cd3a6d0a22 text-sm px-2 rounded-l-lg">
              <a
                href="#installation"
                class="jsx-3298f0cd3a6d0a22 text-secondary dark:text-secondary-dark block hover:text-link dark:hover:text-link-dark leading-normal py-2"
              >
                Installation
              </a>
            </li>
            <li class="jsx-3298f0cd3a6d0a22 text-sm px-2 rounded-l-lg">
              <a
                href="#exports"
                class="jsx-3298f0cd3a6d0a22 text-secondary dark:text-secondary-dark block hover:text-link dark:hover:text-link-dark leading-normal py-2"
              >
                Exports
              </a>
            </li>
            <li class="jsx-3298f0cd3a6d0a22 text-sm px-2 rounded-l-lg pl-4">
              <a
                href="#state"
                class="jsx-3298f0cd3a6d0a22 text-secondary dark:text-secondary-dark block hover:text-link dark:hover:text-link-dark leading-normal py-2"
              >
                State
              </a>
            </li>
            <li class="jsx-3298f0cd3a6d0a22 text-sm px-2 rounded-l-lg pl-4">
              <a
                href="#context"
                class="jsx-3298f0cd3a6d0a22 text-secondary dark:text-secondary-dark block hover:text-link dark:hover:text-link-dark leading-normal py-2"
              >
                Context
              </a>
            </li>
            <li class="jsx-3298f0cd3a6d0a22 text-sm px-2 rounded-l-lg pl-4">
              <a
                href="#refs"
                class="jsx-3298f0cd3a6d0a22 text-secondary dark:text-secondary-dark block hover:text-link dark:hover:text-link-dark leading-normal py-2"
              >
                Refs
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

function Footer() {
  return (
    <div class="self-stretch w-full sm:pl-0 lg:pl-80 sm:pr-0 2xl:pr-80 pl-0 pr-0">
      <div class="mx-auto w-full px-5 sm:px-12 md:px-12 pt-10 md:pt-12 lg:pt-10">
        <hr class="max-w-7xl mx-auto border-border dark:border-border-dark" />
      </div>
      <footer class="text-secondary dark:text-secondary-dark py-12 px-5 sm:px-12 md:px-12 sm:py-12 md:py-16 lg:py-14">
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-x-12 gap-y-8 max-w-7xl mx-auto ">
          <a
            href="https://opensource.fb.com/"
            target="_blank"
            rel="noopener"
            class="col-span-2 sm:col-span-1 justify-items-start w-44 text-left"
          >
            <div>
              <svg
                class="mt-4 mb-4"
                width="115"
                height="13"
                viewBox="0 0 115 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.12655 0.414727V2.061C9.1323 2.15436 9.06215 2.23355 8.97245 2.23945C8.96555 2.23945 8.95865 2.23945 8.95175 2.23945H2.07259V5.60409H7.75002C7.84087 5.59818 7.91792 5.67027 7.92367 5.76364C7.92367 5.76955 7.92367 5.77664 7.92367 5.78255V7.43C7.92942 7.52336 7.85927 7.60254 7.76842 7.60845C7.76267 7.60845 7.75577 7.60845 7.75002 7.60845H2.07259V12.5827C2.07949 12.6761 2.01049 12.7565 1.92079 12.7635C1.91389 12.7635 1.90699 12.7635 1.90009 12.7635H0.175126C0.084278 12.7695 0.00607958 12.6974 0.000329697 12.6028C0.000329697 12.5969 0.000329697 12.5898 0.000329697 12.5839V0.411182C-0.00542019 0.317818 0.0647284 0.237454 0.156727 0.231545C0.162476 0.231545 0.169376 0.231545 0.175126 0.231545H8.9506C9.04145 0.225636 9.1208 0.296545 9.12655 0.389909C9.1277 0.398182 9.1277 0.406454 9.12655 0.414727Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M23.1608 12.7637H21.2633C21.1656 12.7708 21.0793 12.701 21.0621 12.6018C20.8102 11.5736 20.5055 10.491 20.157 9.39902H14.3324C13.9874 10.491 13.6792 11.5736 13.4354 12.6018C13.4193 12.701 13.3331 12.7708 13.2353 12.7637H11.4068C11.285 12.7637 11.216 12.6916 11.2505 12.5663C12.3475 8.57648 14.0184 4.17539 15.7078 0.469206C15.7549 0.317933 15.8987 0.219842 16.0528 0.232842H18.5172C18.6713 0.219842 18.815 0.317933 18.8621 0.469206C20.6561 4.37393 22.1465 8.4193 23.3195 12.5663C23.3528 12.6904 23.2827 12.7637 23.1608 12.7637ZM19.513 7.46675C18.8771 5.65857 18.1722 3.85157 17.4431 2.2053H17.0348C16.3115 3.85157 15.5974 5.65857 14.9649 7.46675H19.513Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M26.2773 6.60636C26.2773 2.71818 28.767 0 32.317 0H32.5781C34.8079 0 36.5317 1.16291 37.4459 2.84464C37.5011 2.91082 37.4942 3.01127 37.4287 3.068C37.416 3.07982 37.4011 3.08927 37.385 3.09518L35.8521 3.874C35.7543 3.94018 35.6221 3.91182 35.5577 3.81136C35.5542 3.80545 35.5508 3.79955 35.5473 3.79364C34.9033 2.64845 33.9373 2.03982 32.5091 2.03982H32.248C30.0102 2.03982 28.4692 3.86455 28.4692 6.513C28.4692 9.16145 29.9837 10.9507 32.248 10.9507H32.5091C33.9718 10.9507 34.8251 10.4414 35.4783 9.66255C35.545 9.57036 35.6681 9.54318 35.7658 9.59991L37.3413 10.387C37.3907 10.4095 37.4241 10.4567 37.4287 10.5123C37.4252 10.5619 37.4068 10.6092 37.3758 10.647C36.4098 12.0971 34.6687 12.9917 32.5459 12.9917H32.2848C28.6716 13 26.2773 10.4449 26.2773 6.60636Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M51.3171 10.9367V12.5829C51.3228 12.6763 51.2527 12.7567 51.1607 12.7626C51.1549 12.7626 51.1492 12.7626 51.1434 12.7626H42.0011C41.9103 12.7685 41.8332 12.6964 41.8275 12.6042C41.8275 12.5971 41.8275 12.59 41.8275 12.5829V0.4102C41.8217 0.316836 41.8907 0.236473 41.9804 0.230563C41.9873 0.230563 41.9942 0.230563 42.0011 0.230563H50.9859C51.0767 0.224654 51.1549 0.296745 51.1607 0.391291C51.1607 0.3972 51.1607 0.404291 51.1607 0.4102V2.05647C51.1664 2.14984 51.0963 2.22902 51.0066 2.23493C50.9997 2.23493 50.9928 2.23493 50.9859 2.23493H43.8986V5.49202H49.6623C49.7531 5.48611 49.8313 5.5582 49.8371 5.65275C49.8371 5.65866 49.8371 5.66575 49.8371 5.67166V7.3002C49.8417 7.39356 49.7715 7.47393 49.6795 7.47865C49.6738 7.47865 49.668 7.47865 49.6623 7.47865H43.8986V10.7547H51.1434C51.2343 10.7487 51.3125 10.8197 51.3171 10.913C51.3182 10.9213 51.3182 10.9284 51.3171 10.9367Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M67.058 9.32692C67.058 11.518 65.4216 12.7625 62.5305 12.7625H56.5403C56.4495 12.7684 56.3724 12.6963 56.3667 12.6041C56.3667 12.597 56.3667 12.5899 56.3667 12.5828V0.410105C56.3609 0.316741 56.4299 0.236378 56.5196 0.230469C56.5265 0.230469 56.5334 0.230469 56.5403 0.230469H61.9993C64.8121 0.230469 66.3439 1.37565 66.3439 3.46983C66.3439 4.84783 65.6654 5.75192 64.2889 6.17147C66.222 6.59692 67.058 7.78701 67.058 9.32692ZM61.9556 2.18638H58.4389V5.55456H61.9556C63.5322 5.55456 64.2555 5.02629 64.2555 3.87165C64.2555 2.71701 63.5322 2.18638 61.9556 2.18638ZM64.934 9.13902C64.934 7.97492 64.1854 7.44783 62.5398 7.44783H58.4389V10.8113H62.5398C64.2107 10.8113 64.934 10.3102 64.934 9.13902Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M70.7057 6.5C70.7057 2.72409 73.1436 0 76.9742 0H77.2353C81.0658 0 83.5038 2.71818 83.5038 6.5C83.5038 10.2818 81.0658 13 77.2353 13H76.9742C73.1413 13 70.7057 10.2747 70.7057 6.5ZM77.2353 10.9555C79.7342 10.9555 81.3096 9.19336 81.3096 6.5C81.3096 3.80664 79.7342 2.04455 77.2353 2.04455H76.9742C74.4753 2.04455 72.8998 3.80664 72.8998 6.5C72.8998 9.19336 74.4753 10.9555 76.9742 10.9555H77.2353Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M87.0387 6.5C87.0387 2.72409 89.4766 0 93.3072 0H93.5683C97.3988 0 99.8368 2.71818 99.8368 6.5C99.8368 10.2818 97.3988 13 93.5683 13H93.3072C89.4766 13 87.0387 10.2747 87.0387 6.5ZM93.5683 10.9555C96.0672 10.9555 97.6426 9.19336 97.6426 6.5C97.6426 3.80664 96.0672 2.04455 93.5683 2.04455H93.3072C90.8083 2.04455 89.2329 3.80664 89.2329 6.5C89.2329 9.19336 90.8083 10.9555 93.3072 10.9555H93.5683Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M114.855 12.7637H112.608C112.488 12.7744 112.37 12.7153 112.304 12.6113C110.758 10.7511 109.079 9.01266 107.28 7.41129H106.271V12.5829C106.277 12.6763 106.206 12.7567 106.114 12.7626C106.109 12.7626 106.102 12.7626 106.096 12.7626H104.371C104.28 12.7685 104.203 12.6964 104.197 12.6042C104.197 12.5971 104.197 12.59 104.197 12.5829V0.4102C104.192 0.316836 104.261 0.236473 104.35 0.230563C104.357 0.230563 104.364 0.230563 104.371 0.230563H106.096C106.187 0.224654 106.265 0.296745 106.271 0.391291C106.271 0.3972 106.271 0.404291 106.271 0.4102V5.35375H107.295C108.951 3.83393 110.472 2.16638 111.84 0.370018C111.895 0.279018 111.996 0.227018 112.101 0.235291H114.226C114.33 0.235291 114.383 0.289654 114.383 0.360563C114.378 0.411382 114.356 0.458654 114.322 0.495291C112.682 2.59893 110.861 4.54538 108.88 6.31102C111.065 8.21375 113.095 10.2961 114.948 12.538C115.046 12.655 115 12.7637 114.855 12.7637Z"
                  fill="currentColor"
                ></path>
              </svg>
              Open Source
            </div>
            <div class="text-xs text-left mt-2 pr-0.5">©2022</div>
          </a>
          <div class="flex flex-col">
            <div>
              <a
                class="border-b inline-block border-transparent text-md text-secondary dark:text-secondary-dark my-2 font-bold hover:border-gray-10"
                href="/learn"
              >
                Learn React
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/learn"
              >
                Quick Start
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/learn/installation"
              >
                Installation
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/learn/describing-the-ui"
              >
                Describing the UI
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/learn/adding-interactivity"
              >
                Adding Interactivity
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/learn/managing-state"
              >
                Managing State
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/learn/escape-hatches"
              >
                Escape Hatches
              </a>
            </div>
          </div>
          <div class="flex flex-col">
            <div>
              <a
                class="border-b inline-block border-transparent text-md text-secondary dark:text-secondary-dark my-2 font-bold hover:border-gray-10"
                href="/apis"
              >
                API Reference
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/apis"
              >
                React APIs
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/apis/reactdom"
              >
                React DOM APIs
              </a>
            </div>
          </div>
          <div class="flex flex-col sm:col-start-2 xl:col-start-4">
            <div>
              <a
                class="border-b inline-block border-transparent text-md text-secondary dark:text-secondary-dark my-2 font-bold hover:border-gray-10"
                href="/"
              >
                Community
              </a>
            </div>
            <div>
              <a
                href="https://github.com/facebook/react/blob/main/CODE_OF_CONDUCT.md"
                target="_blank"
                rel="noopener"
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
              >
                Code of Conduct
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/community/acknowledgements"
              >
                Acknowledgements
              </a>
            </div>
            <div>
              <a
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
                href="/community/meet-the-team"
              >
                Meet the Team
              </a>
            </div>
          </div>
          <div class="flex flex-col">
            <div class="border-b inline-block border-transparent text-md text-secondary dark:text-secondary-dark my-2 font-bold">
              More
            </div>
            <div>
              <a
                href="https://reactnative.dev/"
                target="_blank"
                rel="noopener"
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
              >
                React Native
              </a>
            </div>
            <div>
              <a
                href="https://opensource.facebook.com/legal/privacy"
                target="_blank"
                rel="noopener"
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
              >
                Privacy
              </a>
            </div>
            <div>
              <a
                href="https://opensource.fb.com/legal/terms/"
                target="_blank"
                rel="noopener"
                class="border-b inline-block border-transparent text-sm text-primary dark:text-primary-dark hover:border-gray-10"
              >
                Terms
              </a>
            </div>
            <div class="flex flex-row mt-8 gap-x-2">
              <a
                href="https://www.facebook.com/react"
                target="_blank"
                rel="noopener"
                aria-label="React on Facebook"
                class="hover:text-primary dark:text-primary-dark"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="1.33em"
                  height="1.33em"
                  fill="currentColor"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
              </a>
              <a
                href="https://twitter.com/reactjs"
                target="_blank"
                rel="noopener"
                aria-label="React on Twitter"
                class="hover:text-primary dark:text-primary-dark"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="1.33em"
                  height="1.33em"
                  fill="currentColor"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
