import { NavLink, useLocation } from "solid-app-router";

function ActiveLink(props) {
  const location = useLocation();
  return (
    <a
      href={props.href}
      classList={{
        [props.className]: true,
        [props.activeClass]: props.isActive(location),
        [props.inactiveClass]: !props.isActive(location)
      }}
    >
      {props.children}
    </a>
  );
}

export const NavHeader = () => (
  <nav className="sticky top-0 items-center w-full flex lg:block justify-between bg-wash dark:bg-wash-dark pt-0 lg:pt-4 pr-5 lg:px-5 z-50">
    <div className="xl:w-full xl:max-w-xs flex items-center">
      <button type="button" aria-label="Menu" className="flex lg:hidden items-center h-full px-4">
        <MenuIcon />
      </button>
      <a
        className="inline-flex text-lg font-normal items-center text-primary dark:text-primary-dark py-1 mr-0 sm:mr-3 whitespace-nowrap"
        href="/"
      >
        <Logo className="text-sm mr-2 w-8 h-8 text-link dark:text-link-dark" />
        <span class="font-bold">Solid </span> <span class="italic">Start</span>
      </a>
      <div className="lg:w-full leading-loose hidden sm:flex flex-initial items-center h-auto pr-5 lg:pr-5 pt-0.5">
        <div className="px-1 mb-px bg-highlight dark:bg-highlight-dark rounded text-link dark:text-link-dark uppercase font-bold tracking-wide text-xs whitespace-nowrap">
          Beta
        </div>
      </div>
      <div className="block dark:hidden">
        <button
          type="button"
          aria-label="Use Dark Mode"
          className="hidden lg:flex items-center h-full pr-2"
          onClick={() => {
            document.documentElement.classList.toggle("dark");
            document.documentElement.classList.toggle("light");
          }}
        >
          <MoonIcon />
        </button>
      </div>
      <div
        className="hidden dark:block"
        onClick={() => {
          document.documentElement.classList.toggle("dark");
          document.documentElement.classList.toggle("light");
        }}
      >
        <button
          type="button"
          aria-label="Use Light Mode"
          className="hidden lg:flex items-center h-full pr-2"
        >
          <SunIcon />
        </button>
      </div>
    </div>
    <div className="px-0 pt-2 w-full 2xl:max-w-xs hidden lg:flex items-center self-center border-b-0 lg:border-b border-border dark:border-border-dark">
      <ActiveLink
        isActive={loc =>
          loc.pathname.startsWith("/") &&
          !loc.pathname.startsWith("/api") &&
          !loc.pathname.startsWith("/learn")
        }
        activeClass="text-link border-link dark:text-link-dark dark:border-link-dark font-bold"
        className="border-transparent inline-flex w-full items-center border-b-2 justify-center text-base leading-9 px-3 py-0.5 hover:text-link dark:hover:text-link-dark whitespace-nowrap"
        href="/"
      >
        Home
      </ActiveLink>
      <ActiveLink
        isActive={loc => loc.pathname.startsWith("/learn")}
        activeClass="text-link border-link dark:text-link-dark dark:border-link-dark font-bold"
        className="border-transparent inline-flex w-full items-center border-b-2 justify-center text-base leading-9 px-3 py-0.5 hover:text-link dark:hover:text-link-dark whitespace-nowrap"
        href="/learn"
      >
        Learn
      </ActiveLink>
      <ActiveLink
        isActive={loc => loc.pathname.startsWith("/api")}
        activeClass="text-link border-link dark:text-link-dark dark:border-link-dark font-bold"
        className="border-transparent inline-flex w-full items-center border-b-2 justify-center text-base leading-9 px-3 py-0.5 hover:text-link dark:hover:text-link-dark whitespace-nowrap"
        href="/api"
      >
        API
      </ActiveLink>
    </div>
    <div className="flex my-4 h-10 mx-0 w-full lg:hidden justify-end lg:max-w-sm">
      <SearchBar />
      <button
        aria-label="Give feedback"
        type="button"
        className="inline-flex lg:hidden items-center rounded-full px-1.5 ml-4 lg:ml-6 relative top-px"
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.41477 2.29921C8.41479 2.29923 8.41476 2.2992 8.41477 2.29921L8.48839 2.35275C8.91454 2.66267 9.22329 3.10774 9.36429 3.61547C9.50529 4.12319 9.47029 4.6637 9.26497 5.14899L8.33926 7.33703H11C11.7072 7.33703 12.3855 7.61798 12.8856 8.11807C13.3857 8.61817 13.6667 9.29645 13.6667 10.0037V12.6704C13.6667 13.5544 13.3155 14.4023 12.6904 15.0274C12.0652 15.6525 11.2174 16.0037 10.3333 16.0037H5C3.93914 16.0037 2.92172 15.5823 2.17157 14.8321C1.42142 14.082 1 13.0646 1 12.0037V10.7531C1 9.68422 1.36696 8.6477 2.03953 7.81688L6.27886 2.58006C6.53107 2.26851 6.89328 2.06562 7.29077 2.01335C7.68823 1.96109 8.09061 2.06347 8.41477 2.29921ZM7.63054 3.37753C7.58264 3.34269 7.52323 3.32759 7.46459 3.33531C7.40594 3.34302 7.35245 3.37296 7.31519 3.41899L3.07585 8.65581C2.59545 9.24925 2.33333 9.98963 2.33333 10.7531V12.0037C2.33333 12.7109 2.61428 13.3892 3.11438 13.8893C3.61448 14.3894 4.29275 14.6704 5 14.6704H10.3333C10.8638 14.6704 11.3725 14.4596 11.7475 14.0846C12.1226 13.7095 12.3333 13.2008 12.3333 12.6704V10.0037C12.3333 9.65007 12.1929 9.31093 11.9428 9.06088C11.6928 8.81084 11.3536 8.67036 11 8.67036H7.33333C7.10979 8.67036 6.90112 8.55832 6.77763 8.37198C6.65413 8.18564 6.63225 7.94981 6.71936 7.74393L8.03701 4.62947C8.125 4.42149 8.14001 4.18984 8.07958 3.97224C8.01916 3.75467 7.88687 3.56396 7.70425 3.43113L7.63054 3.37753Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.2517 25.7047C19.2517 25.7047 19.2517 25.7047 19.2517 25.7047L19.1781 25.6512C18.752 25.3412 18.4432 24.8962 18.3022 24.3884C18.1612 23.8807 18.1962 23.3402 18.4015 22.8549L19.3272 20.6669L16.6665 20.6669C15.9593 20.6669 15.281 20.3859 14.7809 19.8858C14.2808 19.3857 13.9998 18.7075 13.9998 18.0002L13.9998 15.3335C13.9998 14.4495 14.351 13.6016 14.9761 12.9765C15.6013 12.3514 16.4491 12.0002 17.3332 12.0002L22.6665 12.0002C23.7274 12.0002 24.7448 12.4216 25.4949 13.1718C26.2451 13.9219 26.6665 14.9393 26.6665 16.0002L26.6665 17.2508C26.6665 18.3197 26.2995 19.3562 25.627 20.187L21.3876 25.4238C21.1354 25.7354 20.7732 25.9383 20.3757 25.9906C19.9783 26.0428 19.5759 25.9404 19.2517 25.7047ZM20.036 24.6264C20.0839 24.6612 20.1433 24.6763 20.2019 24.6686C20.2606 24.6609 20.3141 24.6309 20.3513 24.5849L24.5907 19.3481C25.0711 18.7547 25.3332 18.0143 25.3332 17.2508L25.3332 16.0002C25.3332 15.293 25.0522 14.6147 24.5521 14.1146C24.052 13.6145 23.3738 13.3335 22.6665 13.3335L17.3332 13.3335C16.8027 13.3335 16.294 13.5443 15.919 13.9193C15.5439 14.2944 15.3332 14.8031 15.3332 15.3335L15.3332 18.0002C15.3332 18.3538 15.4736 18.693 15.7237 18.943C15.9737 19.1931 16.3129 19.3335 16.6665 19.3335L20.3332 19.3335C20.5567 19.3335 20.7654 19.4456 20.8889 19.6319C21.0124 19.8183 21.0343 20.0541 20.9471 20.26L19.6295 23.3744C19.5415 23.5824 19.5265 23.8141 19.5869 24.0317C19.6473 24.2492 19.7796 24.4399 19.9623 24.5728L20.036 24.6264Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <div className="block dark:hidden">
        <button
          type="button"
          aria-label="Use Dark Mode"
          className="flex lg:hidden items-center p-1 h-full ml-4 lg:ml-6"
        >
          <MoonIcon />
        </button>
      </div>
      <div className="fixed top-12 right-0 hidden">
        <div className="max-w-xs w-80 lg:w-auto py-3 shadow-lg rounded-lg m-4 bg-wash dark:bg-gray-95 px-4 flex">
          <p className="w-full font-bold text-primary dark:text-primary-dark text-lg">
            Is this page useful?
          </p>
          <button
            aria-label="Yes"
            className="bg-secondary-button dark:bg-secondary-button-dark rounded-lg text-primary dark:text-primary-dark px-3 mr-2"
          >
            <ThumbsUpIcon />
          </button>
          <button
            aria-label="No"
            className="bg-secondary-button dark:bg-secondary-button-dark rounded-lg text-primary dark:text-primary-dark px-3"
          >
            <ThumbsDownIcon />
          </button>
        </div>
      </div>
      <div className="hidden dark:block">
        <button
          type="button"
          aria-label="Use Light Mode"
          className="flex lg:hidden items-center p-1 h-full ml-4 lg:ml-6"
        >
          <SunIcon />
        </button>
      </div>
    </div>
  </nav>
);
export function SearchBar() {
  return (
    <>
      <button
        aria-label="Search"
        type="button"
        className="inline-flex md:hidden items-center text-lg p-1 ml-4 lg:ml-6"
      >
        <SearchIcon />
      </button>
      <button
        type="button"
        className="hidden md:flex relative pl-4 pr-0.5 py-1 h-10 bg-secondary-button dark:bg-gray-700 outline-none focus:ring focus:outline-none betterhover:hover:bg-opacity-80 pointer items-center shadow-inner text-left w-full text-gray-30 rounded-lg align-middle text-sm"
      >
        <SearchIcon class="mr-3 align-middle text-gray-30 shrink-0 group-betterhover:hover:text-gray-70" />
        Search
        <span className="ml-auto hidden sm:flex item-center">
          <kbd className="h-6 w-6 border border-transparent mr-1 bg-wash dark:bg-wash-dark text-gray-30 align-middle p-0 inline-flex justify-center items-center text-xs text-center rounded">
            ⌘
          </kbd>
          <kbd className="h-6 w-6 border border-transparent mr-1 bg-wash dark:bg-wash-dark text-gray-30 align-middle p-0 inline-flex justify-center items-center text-xs text-center rounded">
            K
          </kbd>
        </span>
      </button>
    </>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width={16} height={18} viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.36603 0.384603C9.36605 0.384617 9.36601 0.384588 9.36603 0.384603L9.45902 0.453415C9.99732 0.851783 10.3873 1.42386 10.5654 2.07648C10.7435 2.72909 10.6993 3.42385 10.44 4.04763L9.27065 6.86008H12.6316C13.5249 6.86008 14.3817 7.22121 15.0134 7.86402C15.6451 8.50683 16 9.37868 16 10.2877V13.7154C16 14.8518 15.5564 15.9416 14.7668 16.7451C13.9771 17.5486 12.9062 18 11.7895 18H5.05263C3.71259 18 2.42743 17.4583 1.47988 16.4941C0.532325 15.5299 0 14.2221 0 12.8585V11.2511C2.40928e-06 9.87711 0.463526 8.54479 1.31308 7.47688L6.66804 0.745592C6.98662 0.345136 7.44414 0.08434 7.94623 0.0171605C8.4483 -0.0500155 8.95656 0.0815891 9.36603 0.384603ZM8.37542 1.77064C8.31492 1.72587 8.23987 1.70646 8.16579 1.71637C8.09171 1.72628 8.02415 1.76477 7.97708 1.82393L2.62213 8.55522C2.0153 9.31801 1.68421 10.2697 1.68421 11.2511V12.8585C1.68421 13.7676 2.03909 14.6394 2.67079 15.2822C3.30249 15.925 4.15927 16.2862 5.05263 16.2862H11.7895C12.4595 16.2862 13.1021 16.0153 13.5759 15.5332C14.0496 15.0511 14.3158 14.3972 14.3158 13.7154V10.2877C14.3158 9.83321 14.1383 9.39729 13.8225 9.07588C13.5066 8.75448 13.0783 8.57392 12.6316 8.57392H8C7.71763 8.57392 7.45405 8.4299 7.29806 8.19039C7.14206 7.95087 7.11442 7.64774 7.22445 7.38311L8.88886 3.37986C9 3.11253 9.01896 2.81477 8.94262 2.53507C8.8663 2.25541 8.69921 2.01027 8.46853 1.83954L8.37542 1.77064Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg width={16} height={18} viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.63397 17.6154C6.63395 17.6154 6.63399 17.6154 6.63397 17.6154L6.54098 17.5466C6.00268 17.1482 5.61269 16.5761 5.43458 15.9235C5.25648 15.2709 5.30069 14.5761 5.56004 13.9524L6.72935 11.1399L3.36842 11.1399C2.47506 11.1399 1.61829 10.7788 0.986585 10.136C0.354883 9.49316 8.1991e-07 8.62132 8.99384e-07 7.71225L1.19904e-06 4.28458C1.29838e-06 3.14824 0.443605 2.05844 1.23323 1.25492C2.02286 0.451403 3.09383 -1.12829e-06 4.21053 -1.03067e-06L10.9474 -4.41715e-07C12.2874 -3.24565e-07 13.5726 0.541687 14.5201 1.50591C15.4677 2.47013 16 3.77789 16 5.1415L16 6.74893C16 8.12289 15.5365 9.45521 14.6869 10.5231L9.33196 17.2544C9.01338 17.6549 8.55586 17.9157 8.05377 17.9828C7.5517 18.05 7.04344 17.9184 6.63397 17.6154ZM7.62458 16.2294C7.68508 16.2741 7.76013 16.2935 7.83421 16.2836C7.90829 16.2737 7.97585 16.2352 8.02292 16.1761L13.3779 9.44478C13.9847 8.68199 14.3158 7.73033 14.3158 6.74892L14.3158 5.1415C14.3158 4.23242 13.9609 3.36058 13.3292 2.71777C12.6975 2.07496 11.8407 1.71383 10.9474 1.71383L4.21053 1.71383C3.5405 1.71383 2.89793 1.98468 2.42415 2.46679C1.95038 2.94889 1.68421 3.60277 1.68421 4.28458L1.68421 7.71225C1.68421 8.16679 1.86166 8.60271 2.1775 8.92411C2.49335 9.24552 2.92174 9.42608 3.36842 9.42608L8 9.42608C8.28237 9.42608 8.54595 9.5701 8.70195 9.80961C8.85794 10.0491 8.88558 10.3523 8.77555 10.6169L7.11114 14.6201C7 14.8875 6.98105 15.1852 7.05738 15.4649C7.1337 15.7446 7.30079 15.9897 7.53147 16.1605L7.62458 16.2294Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 20 20" class={"align-middle " + props.class}>
      <path
        d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
        stroke="currentColor"
        fill="none"
        strokeWidth={2}
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24">
      <g fill="none" fillRule="evenodd" transform="translate(-444 -204)">
        <g fill="currentColor" transform="translate(354 144)">
          <path
            fillRule="nonzero"
            d="M108.5 24C108.5 27.5902136 105.590214 30.5 102 30.5 98.4097864 30.5 95.5 27.5902136 95.5 24 95.5 20.4097864 98.4097864 17.5 102 17.5 105.590214 17.5 108.5 20.4097864 108.5 24zM107 24C107 21.2382136 104.761786 19 102 19 99.2382136 19 97 21.2382136 97 24 97 26.7617864 99.2382136 29 102 29 104.761786 29 107 26.7617864 107 24zM101 12.75L101 14.75C101 15.1642136 101.335786 15.5 101.75 15.5 102.164214 15.5 102.5 15.1642136 102.5 14.75L102.5 12.75C102.5 12.3357864 102.164214 12 101.75 12 101.335786 12 101 12.3357864 101 12.75zM95.7255165 14.6323616L96.7485165 16.4038616C96.9556573 16.7625614 97.4143618 16.8854243 97.7730616 16.6782835 98.1317614 16.4711427 98.2546243 16.0124382 98.0474835 15.6537384L97.0244835 13.8822384C96.8173427 13.5235386 96.3586382 13.4006757 95.9999384 13.6078165 95.6412386 13.8149573 95.5183757 14.2736618 95.7255165 14.6323616zM91.8822384 19.0244835L93.6537384 20.0474835C94.0124382 20.2546243 94.4711427 20.1317614 94.6782835 19.7730616 94.8854243 19.4143618 94.7625614 18.9556573 94.4038616 18.7485165L92.6323616 17.7255165C92.2736618 17.5183757 91.8149573 17.6412386 91.6078165 17.9999384 91.4006757 18.3586382 91.5235386 18.8173427 91.8822384 19.0244835zM90.75 25L92.75 25C93.1642136 25 93.5 24.6642136 93.5 24.25 93.5 23.8357864 93.1642136 23.5 92.75 23.5L90.75 23.5C90.3357864 23.5 90 23.8357864 90 24.25 90 24.6642136 90.3357864 25 90.75 25zM92.6323616 30.2744835L94.4038616 29.2514835C94.7625614 29.0443427 94.8854243 28.5856382 94.6782835 28.2269384 94.4711427 27.8682386 94.0124382 27.7453757 93.6537384 27.9525165L91.8822384 28.9755165C91.5235386 29.1826573 91.4006757 29.6413618 91.6078165 30.0000616 91.8149573 30.3587614 92.2736618 30.4816243 92.6323616 30.2744835zM97.0244835 34.1177616L98.0474835 32.3462616C98.2546243 31.9875618 98.1317614 31.5288573 97.7730616 31.3217165 97.4143618 31.1145757 96.9556573 31.2374386 96.7485165 31.5961384L95.7255165 33.3676384C95.5183757 33.7263382 95.6412386 34.1850427 95.9999384 34.3921835 96.3586382 34.5993243 96.8173427 34.4764614 97.0244835 34.1177616zM103 35.25L103 33.25C103 32.8357864 102.664214 32.5 102.25 32.5 101.835786 32.5 101.5 32.8357864 101.5 33.25L101.5 35.25C101.5 35.6642136 101.835786 36 102.25 36 102.664214 36 103 35.6642136 103 35.25zM108.274483 33.3676384L107.251483 31.5961384C107.044343 31.2374386 106.585638 31.1145757 106.226938 31.3217165 105.868239 31.5288573 105.745376 31.9875618 105.952517 32.3462616L106.975517 34.1177616C107.182657 34.4764614 107.641362 34.5993243 108.000062 34.3921835 108.358761 34.1850427 108.481624 33.7263382 108.274483 33.3676384zM112.117762 28.9755165L110.346262 27.9525165C109.987562 27.7453757 109.528857 27.8682386 109.321717 28.2269384 109.114576 28.5856382 109.237439 29.0443427 109.596138 29.2514835L111.367638 30.2744835C111.726338 30.4816243 112.185043 30.3587614 112.392183 30.0000616 112.599324 29.6413618 112.476461 29.1826573 112.117762 28.9755165zM113.25 23L111.25 23C110.835786 23 110.5 23.3357864 110.5 23.75 110.5 24.1642136 110.835786 24.5 111.25 24.5L113.25 24.5C113.664214 24.5 114 24.1642136 114 23.75 114 23.3357864 113.664214 23 113.25 23zM111.367638 17.7255165L109.596138 18.7485165C109.237439 18.9556573 109.114576 19.4143618 109.321717 19.7730616 109.528857 20.1317614 109.987562 20.2546243 110.346262 20.0474835L112.117762 19.0244835C112.476461 18.8173427 112.599324 18.3586382 112.392183 17.9999384 112.185043 17.6412386 111.726338 17.5183757 111.367638 17.7255165zM106.975517 13.8822384L105.952517 15.6537384C105.745376 16.0124382 105.868239 16.4711427 106.226938 16.6782835 106.585638 16.8854243 107.044343 16.7625614 107.251483 16.4038616L108.274483 14.6323616C108.481624 14.2736618 108.358761 13.8149573 108.000062 13.6078165 107.641362 13.4006757 107.182657 13.5235386 106.975517 13.8822384z"
            transform="translate(0 48)"
          />
          <path
            d="M98.6123,60.1372 C98.6123,59.3552 98.8753,58.6427 99.3368,58.0942 C99.5293,57.8657 99.3933,57.5092 99.0943,57.5017 C99.0793,57.5012 99.0633,57.5007 99.0483,57.5007 C97.1578,57.4747 95.5418,59.0312 95.5008,60.9217 C95.4578,62.8907 97.0408,64.5002 98.9998,64.5002 C99.7793,64.5002 100.4983,64.2452 101.0798,63.8142 C101.3183,63.6372 101.2358,63.2627 100.9478,63.1897 C99.5923,62.8457 98.6123,61.6072 98.6123,60.1372"
            transform="translate(3 11)"
          />
        </g>
        <polygon points="444 228 468 228 468 204 444 204" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24">
      <g fill="none" fillRule="evenodd" transform="translate(-444 -204)">
        <path
          fill="currentColor"
          fillRule="nonzero"
          d="M102,21 C102,18.1017141 103.307179,15.4198295 105.51735,13.6246624 C106.001939,13.2310647 105.821611,12.4522936 105.21334,12.3117518 C104.322006,12.1058078 103.414758,12 102.5,12 C95.8722864,12 90.5,17.3722864 90.5,24 C90.5,30.6277136 95.8722864,36 102.5,36 C106.090868,36 109.423902,34.4109093 111.690274,31.7128995 C112.091837,31.2348572 111.767653,30.5041211 111.143759,30.4810139 C106.047479,30.2922628 102,26.1097349 102,21 Z M102.5,34.5 C96.7007136,34.5 92,29.7992864 92,24 C92,18.2007136 96.7007136,13.5 102.5,13.5 C102.807386,13.5 103.113925,13.5136793 103.419249,13.5407785 C101.566047,15.5446378 100.5,18.185162 100.5,21 C100.5,26.3198526 104.287549,30.7714322 109.339814,31.7756638 L109.516565,31.8092927 C107.615276,33.5209452 105.138081,34.5 102.5,34.5 Z"
          transform="translate(354.5 192)"
        />
        <polygon points="444 228 468 228 468 204 444 204" />
      </g>
    </svg>
  );
}

export function Logo(props) {
  return (
    // <svg
    //   width="100%"
    //   height="100%"
    //   viewBox="0 0 410 369"
    //   fill="none"
    //   xmlns="http://www.w3.org/2000/svg"
    //   {...props}
    // >
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      viewBox="0 0 166 155.3"
    >
      <defs>
        <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="27.5" y1="3" x2="152" y2="63.5">
          <stop offset=".1" stop-color="#76b3e1" />
          <stop offset=".3" stop-color="#dcf2fd" />
          <stop offset="1" stop-color="#76b3e1" />
        </linearGradient>
        <linearGradient
          id="b"
          gradientUnits="userSpaceOnUse"
          x1="95.8"
          y1="32.6"
          x2="74"
          y2="105.2"
        >
          <stop offset="0" stop-color="#76b3e1" />
          <stop offset=".5" stop-color="#4377bb" />
          <stop offset="1" stop-color="#1f3b77" />
        </linearGradient>
        <linearGradient
          id="c"
          gradientUnits="userSpaceOnUse"
          x1="18.4"
          y1="64.2"
          x2="144.3"
          y2="149.8"
        >
          <stop offset="0" stop-color="#315aa9" />
          <stop offset=".5" stop-color="#518ac8" />
          <stop offset="1" stop-color="#315aa9" />
        </linearGradient>
        <linearGradient
          id="d"
          gradientUnits="userSpaceOnUse"
          x1="75.2"
          y1="74.5"
          x2="24.4"
          y2="260.8"
        >
          <stop offset="0" stop-color="#4377bb" />
          <stop offset=".5" stop-color="#1a336b" />
          <stop offset="1" stop-color="#1a336b" />
        </linearGradient>
      </defs>
      <path
        d="M163 35S110-4 69 5l-3 1c-6 2-11 5-14 9l-2 3-15 26 26 5c11 7 25 10 38 7l46 9 18-30z"
        fill="#76b3e1"
      />
      <path
        d="M163 35S110-4 69 5l-3 1c-6 2-11 5-14 9l-2 3-15 26 26 5c11 7 25 10 38 7l46 9 18-30z"
        opacity=".3"
        fill="url(#a)"
      />
      <path d="m52 35-4 1c-17 5-22 21-13 35 10 13 31 20 48 15l62-21S92 26 52 35z" fill="#518ac8" />
      <path
        d="m52 35-4 1c-17 5-22 21-13 35 10 13 31 20 48 15l62-21S92 26 52 35z"
        opacity=".3"
        fill="url(#b)"
      />
      <path d="M134 80a45 45 0 0 0-48-15L24 85 4 120l112 19 20-36c4-7 3-15-2-23z" fill="url(#c)" />
      <path d="M114 115a45 45 0 0 0-48-15L4 120s53 40 94 30l3-1c17-5 23-21 13-34z" fill="url(#d)" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="1.33em"
      height="1.33em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={3} y1={12} x2={21} y2={12} />
      <line x1={3} y1={6} x2={21} y2={6} />
      <line x1={3} y1={18} x2={21} y2={18} />
    </svg>
  );
}
