import { NavLink, Route, Routes, useLocation } from "solid-app-router";
import { NavHeader, SearchBar } from "./NavHeader";
import {
  Accordion,
  AccordionButton,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  useHeadlessSelectOptionChild
} from "solid-headless";
import { For } from "solid-js";

export default function Nav() {
  return (
    <div class="no-bg-scrollbar bg-wash dark:bg-wash-dark lg:min-h-screen h-auto lg:h-[calc(100%-40px)] lg:overflow-y-scroll fixed flex flex-row lg:flex-col py-0 left-0 right-0 lg:max-w-xs w-full shadow lg:shadow-none z-50">
      <NavHeader />
      <NavMenu />
    </div>
  );
}

function NavMenu() {
  return (
    <aside
      class="lg:grow lg:flex flex-col w-full pt-4 pb-8 lg:pb-0 lg:max-w-xs fixed lg:sticky bg-wash dark:bg-wash-dark z-10 sm:top-16"
      classList={{
        "lg:block hidden": true,
        "block z-40": false
      }}
      aria-hidden="false"
    >
      <div class="px-5 pt-16 sm:pt-10 lg:pt-0">
        <SearchBar />
      </div>
      <nav
        role="navigation"
        class="w-full h-screen lg:h-auto grow pr-0 lg:pr-5 pt-6 pb-44 lg:pb-0 lg:py-6 md:pt-4 lg:pt-4 overflow-y-scroll lg:overflow-y-auto scrolling-touch scrolling-gpu"
        style="--bg-opacity:0.2;"
      >
        <Routes>
          <Route path="/api/**/*" component={ApiNav} />
          <Route path="/learn/**/*" component={LearnNav} />
          <Route path="/**/*" component={HomeNav} />
        </Routes>
      </nav>
    </aside>
  );
}

const HomeSections = {
  Foundations: {
    header: "Foundations",
    link: "/learn/foundations",
    inSubsections: p => p.startsWith("/api/files")
  },
  Forms: {
    header: "Forms",
    link: "/api/forms",
    inSubsections: p => p.startsWith("/api/forms")
  },
  "Server Functions": {
    header: "Server Functions",
    link: "/api/server",
    inSubsections: p => p.startsWith("/api/server")
  },
  Router: {
    header: "Router",
    link: "/api/router",
    inSubsections: p => p.startsWith("/api/router")
  },
  Session: {
    header: "Session",
    link: "/api/session",
    inSubsections: p => p.startsWith("/api/session")
  }
};

const LEARN_SECTIONS = {
  Foundations: {
    header: "Foundations",
    link: "/learn/foundations",
    subsections: {
      "About Solid": {
        header: "About Solid",
        link: "/learn/foundations/about-solid"
      },
      "From Javascript to Solid": {
        header: "From Javascript to Solid",
        link: "/learn/foundations/from-javascript-to-solid"
      },
      "How SolidStart Works?": {
        header: "How SolidStart Works?",
        link: "/learn/foundations/how-solidstart-works"
      }
    },
    inSubsections: p => p.startsWith("/learn/foundations")
  },
  "Create Your First App": {
    header: "Create Your First App",
    link: "/learn/create-your-first-app",
    subsections: {
      "Create a SolidStart App": {
        header: "Create a SolidStart App",
        link: "/learn/create-your-first-app/create-a-solidstart-app"
      },
      "Navigate between Pages": {
        header: "Navigate between Pages",
        link: "/learn/create-your-first-app/navigate-between-pages"
      },
      "Assets, Metadata and CSS": {
        header: "Assets, Metadata and CSS",
        link: "/learn/create-your-first-app/assets-metadata-and-css"
      },
      "Data fetching": {
        header: "Data fetching",
        link: "/learn/create-your-first-app/data-fetching"
      },
      "Dynamic Routes": {
        header: "Dynamic Routes",
        link: "/learn/create-your-first-app/dynamic-routes"
      }
    },
    inSubsections: p => p.startsWith("/learn/create-your-first-app")
  }
};

function HomeNav() {
  return <SectionNav sections={HomeSections} />;
}

function ApiNav() {
  return <SectionNav sections={SECTIONS} />;
}

function SectionNav(props) {
  const location = useLocation();
  let section = Object.keys(props.sections).find(
    k =>
      location.pathname.startsWith(props.sections[k].link) ||
      props.sections[k].inSubsections(location.pathname)
  );

  return (
    <Accordion
      as="ul"
      toggleable
      defaultValue={section ? props.sections[section].header : undefined}
    >
      <For each={Object.keys(props.sections)}>
        {header => (
          <NavSection href={props.sections[header].link} header={props.sections[header].header}>
            <For each={Object.keys(props.sections[header].subsections ?? {})}>
              {(subsection, i) => (
                <NavItem
                  href={props.sections[header].subsections[subsection].link}
                  title={props.sections[header].subsections[subsection].header}
                >
                  {props.sections[header].subsections[subsection].header}
                </NavItem>
              )}
            </For>
          </NavSection>
        )}
      </For>
    </Accordion>
  );
}

function LearnNav() {
  return <SectionNav sections={LEARN_SECTIONS} />;
  // const location = useLocation();
  // let section = Object.keys(SECTIONS).find(
  //   k =>
  //     location.pathname.startsWith(SECTIONS[k].link) || SECTIONS[k].inSubsections(location.pathname)
  // );

  // return (
  //   <Accordion as="ul" toggleable defaultValue={section ? SECTIONS[section].header : undefined}>
  //     <NavSection href="/api/router" header="Why SolidStart?">
  //       <NavItem href="/api/router/useParams" title="useParams()">
  //         useParams()
  //       </NavItem>
  //       <NavItem href="/api/router/useLocation" title="useLocation()">
  //         useLocation()
  //       </NavItem>
  //       <NavItem href="/api/router/useNavigate" title="useNavigate()">
  //         useNavigate()
  //       </NavItem>
  //       <NavItem href="/api/router/useIsRouting" title="useIsRouting()">
  //         useIsRouting()
  //       </NavItem>
  //       <NavItem href="/api/router/useRouteData" title="useRouteData()">
  //         useRouteData()
  //       </NavItem>
  //       <NavItem href="/api/router/useSearchParams" title="useSearchParams()">
  //         useSearchParams()
  //       </NavItem>
  //       <NavItem href="/api/router/useMatch" title="useMatch()">
  //         useMatch()
  //       </NavItem>
  //       <NavItem href="/api/router/Navigate" title="<Navigate>">
  //         {"<Navigate>"}
  //       </NavItem>
  //       <NavItem href="/api/router/Navlink" title="<Navigate>">
  //         {"<NavLink>"}
  //       </NavItem>
  //     </NavSection>
  //     <NavSection href="/api/router" header="Getting Started">
  //       <NavItem href="/api/router/useParams" title="useParams()">
  //         useParams()
  //       </NavItem>
  //       <NavItem href="/api/router/useLocation" title="useLocation()">
  //         useLocation()
  //       </NavItem>
  //       <NavItem href="/api/router/useNavigate" title="useNavigate()">
  //         useNavigate()
  //       </NavItem>
  //       <NavItem href="/api/router/useIsRouting" title="useIsRouting()">
  //         useIsRouting()
  //       </NavItem>
  //       <NavItem href="/api/router/useRouteData" title="useRouteData()">
  //         useRouteData()
  //       </NavItem>
  //       <NavItem href="/api/router/useSearchParams" title="useSearchParams()">
  //         useSearchParams()
  //       </NavItem>
  //       <NavItem href="/api/router/useMatch" title="useMatch()">
  //         useMatch()
  //       </NavItem>
  //       <NavItem href="/api/router/Navigate" title="<Navigate>">
  //         {"<Navigate>"}
  //       </NavItem>
  //       <NavItem href="/api/router/Navlink" title="<Navigate>">
  //         {"<NavLink>"}
  //       </NavItem>
  //     </NavSection>
  //     <NavSection
  //       header={SECTIONS.FileNameConventions.header}
  //       href={SECTIONS.FileNameConventions.link}
  //     >
  //       <NavItem href="/api/files/root" title="solid-start/root">
  //         src/root.tsx
  //       </NavItem>
  //       <NavItem href="/api/files/entry-client" title="solid-start/entry-client">
  //         src/entry-client.tsx
  //       </NavItem>
  //       <NavItem href="/api/files/entry-server" title="solid-start/entry-server">
  //         src/entry-server.tsx
  //       </NavItem>
  //       <NavItem href="/api/files/routes" title="solid-start/entry-server">
  //         src/routes/**/*
  //       </NavItem>
  //     </NavSection>
  //     <NavSection href="/api/forms" header="Forms">
  //       <NavItem href="/api/forms/createForm" title="createForm()">
  //         createForm()
  //       </NavItem>
  //       <NavItem href="/api/forms/FormError" title=" new FormError()">
  //         new FormError()
  //       </NavItem>
  //       <NavItem href="/api/forms/createAction" title="createAction()">
  //         createAction()
  //       </NavItem>
  //     </NavSection>
  //     <NavSection href="/api/server" header="Server Functions">
  //       <NavItem href="/api/server/server" title="server()">
  //         server()
  //       </NavItem>
  //     </NavSection>
  //     <NavSection href="/api/session" header="How SolidStart Works?">
  //       <NavItem
  //         href="/api/session/createCookieSessionStorage"
  //         end
  //         title="createCookieSessionStorage()"
  //       >
  //         createCookieSessionStorage()
  //       </NavItem>
  //       <NavItem
  //         href="/api/session/createMemorySessionStorage"
  //         end
  //         title="createMemorySessionStorage()"
  //       >
  //         createMemorySessionStorage()
  //       </NavItem>
  //       <NavItem href="/api/session/createSessionStorage" end title="createSessionStorage()">
  //         createSessionStorage()
  //       </NavItem>
  //       <NavItem href="/api/session/createCookie" end title="createCookie()">
  //         createCookie()
  //       </NavItem>
  //     </NavSection>
  //   </Accordion>
  // );
}

const SECTIONS = {
  FileNameConventions: {
    header: "File Name Conventions",
    link: "/api/files",
    subsections: {
      "src/root.tsx": {
        header: "src/root.tsx",
        link: "/api/files/root"
      }
    },
    inSubsections: p => p.startsWith("/api/files")
  },
  Forms: {
    header: "Forms",
    link: "/api/forms",
    inSubsections: p => p.startsWith("/api/forms")
  },
  "Server Functions": {
    header: "Server Functions",
    link: "/api/server",
    inSubsections: p => p.startsWith("/api/server")
  },
  Router: {
    header: "Router",
    link: "/api/router",
    subsections: {
      "useParams()": {
        header: "useParams()",
        link: "/api/router/useParams"
      },
      "useLocation()": {
        header: "useLocation()",
        link: "/api/router/useLocation"
      },
      "useNavigate()": {
        header: "useNavigate()",
        link: "/api/router/useNavigate"
      },
      "useIsRouting()": {
        header: "useIsRouting()",
        link: "/api/router/useIsRouting"
      },
      "useRouteData()": {
        header: "useRouteData()",
        link: "/api/router/useRouteData"
      },
      "useSearchParams()": {
        header: "useSearchParams()",
        link: "/api/router/useSearchParams"
      },
      "useMatch()": {
        header: "useMatch()",
        link: "/api/router/useMatch"
      },
      Navigate: {
        header: "<Navigate>",
        link: "/api/router/Navigate"
      },
      NavLink: {
        header: "<NavLink>",
        link: "/api/router/Navlink"
      }
    },
    inSubsections: p => p.startsWith("/api/router")
  },
  Session: {
    header: "Session",
    link: "/api/session",
    inSubsections: p => p.startsWith("/api/session")
  }
};

function _ApiNav() {
  const location = useLocation();
  let section = Object.keys(SECTIONS).find(
    k =>
      location.pathname.startsWith(SECTIONS[k].link) || SECTIONS[k].inSubsections(location.pathname)
  );

  return (
    <Accordion as="ul" toggleable defaultValue={section ? SECTIONS[section].header : undefined}>
      <NavSection
        header={SECTIONS.FileNameConventions.header}
        href={SECTIONS.FileNameConventions.link}
      >
        <NavItem href="/api/files/root" title="solid-start/root">
          src/root.tsx
        </NavItem>
        <NavItem href="/api/files/entry-client" title="solid-start/entry-client">
          src/entry-client.tsx
        </NavItem>
        <NavItem href="/api/files/entry-server" title="solid-start/entry-server">
          src/entry-server.tsx
        </NavItem>
        <NavItem href="/api/files/routes" title="solid-start/entry-server">
          src/routes/**/*
        </NavItem>
      </NavSection>
      <NavSection href="/api/forms" header="Forms">
        <NavItem href="/api/forms/createForm" title="createForm()">
          createForm()
        </NavItem>
        <NavItem href="/api/forms/FormError" title=" new FormError()">
          new FormError()
        </NavItem>
        <NavItem href="/api/forms/createAction" title="createAction()">
          createAction()
        </NavItem>
      </NavSection>
      <NavSection href="/api/server" header="Server Functions">
        <NavItem href="/api/server/server" title="server()">
          server()
        </NavItem>
      </NavSection>
      <NavSection href="/api/session" header="Session">
        <NavItem
          href="/api/session/createCookieSessionStorage"
          end
          title="createCookieSessionStorage()"
        >
          createCookieSessionStorage()
        </NavItem>
        <NavItem
          href="/api/session/createMemorySessionStorage"
          end
          title="createMemorySessionStorage()"
        >
          createMemorySessionStorage()
        </NavItem>
        <NavItem href="/api/session/createSessionStorage" end title="createSessionStorage()">
          createSessionStorage()
        </NavItem>
        <NavItem href="/api/session/createCookie" end title="createCookie()">
          createCookie()
        </NavItem>
      </NavSection>
    </Accordion>
  );
}

function NavSection(props) {
  return (
    <AccordionItem value={props.header} class="mt-2" as="li">
      <SectionHeader href={props.href}>{props.header}</SectionHeader>
      <SectionPanel>{props.children}</SectionPanel>
    </AccordionItem>
  );
}

function SectionHeader(props) {
  let child = useHeadlessSelectOptionChild();
  const location = useLocation();
  let isActive = () => location.pathname === props.href;
  return (
    <AccordionHeader>
      <a
        classList={{
          "p-2 pr-2 w-full rounded-none lg:rounded-r-lg text-left hover:bg-gray-5 dark:hover:bg-gray-80 relative flex items-center justify-between pl-5 text-base font-bold":
            true,
          "text-primary dark:text-primary-dark": !isActive(),
          "text-link dark:text-link-dark bg-highlight dark:bg-highlight-dark border-blue-40 hover:bg-highlight hover:text-link dark:hover:bg-highlight-dark dark:hover:text-link-dark active":
            isActive()
        }}
        onClick={() => !child.isSelected() && child.select()}
        // title={props.faq.question}
        href={props.href}
      >
        <>
          {props.children}
          <span class={`pr-1`}>
            <CollapsedIcon
              class={`flex-0 transform ${child.isSelected() ? "rotate-0" : "-rotate-90"} w-5 h-5 `}
            />
          </span>
        </>
      </a>
    </AccordionHeader>
  );
}

function SectionPanel(props) {
  return (
    <AccordionPanel
      as="ul"
      class="opacity-100"
      style="transition: opacity 250ms ease-in-out 0s; animation: 250ms ease-in-out 0s 1 normal none running nav-fadein;"
    >
      {props.children}
    </AccordionPanel>
  );
}

function CollapsedIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      class={"duration-100 ease-in transition" + props.class}
      style="min-width: 20px; min-height: 20px;"
    >
      <g fill="none" fill-rule="evenodd" transform="translate(-446 -398)">
        <path
          fill="currentColor"
          fill-rule="nonzero"
          d="M95.8838835,240.366117 C95.3957281,239.877961 94.6042719,239.877961 94.1161165,240.366117 C93.6279612,240.854272 93.6279612,241.645728 94.1161165,242.133883 L98.6161165,246.633883 C99.1042719,247.122039 99.8957281,247.122039 100.383883,246.633883 L104.883883,242.133883 C105.372039,241.645728 105.372039,240.854272 104.883883,240.366117 C104.395728,239.877961 103.604272,239.877961 103.116117,240.366117 L99.5,243.982233 L95.8838835,240.366117 Z"
          transform="translate(356.5 164.5)"
        ></path>
        <polygon points="446 418 466 418 466 398 446 398"></polygon>
      </g>
    </svg>
  );
}

function IsThisPageHelpful() {
  return (
    <div class="max-w-xs w-80 lg:w-auto py-3 shadow-lg rounded-lg m-4 bg-wash dark:bg-gray-95 px-4 flex">
      <p class="w-full font-bold text-primary dark:text-primary-dark text-lg">
        Is this page useful?
      </p>
      <button
        aria-label="Yes"
        class="bg-secondary-button dark:bg-secondary-button-dark rounded-lg text-primary dark:text-primary-dark px-3 mr-2"
      >
        <svg
          width="16"
          height="18"
          viewBox="0 0 16 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.36603 0.384603C9.36605 0.384617 9.36601 0.384588 9.36603 0.384603L9.45902 0.453415C9.99732 0.851783 10.3873 1.42386 10.5654 2.07648C10.7435 2.72909 10.6993 3.42385 10.44 4.04763L9.27065 6.86008H12.6316C13.5249 6.86008 14.3817 7.22121 15.0134 7.86402C15.6451 8.50683 16 9.37868 16 10.2877V13.7154C16 14.8518 15.5564 15.9416 14.7668 16.7451C13.9771 17.5486 12.9062 18 11.7895 18H5.05263C3.71259 18 2.42743 17.4583 1.47988 16.4941C0.532325 15.5299 0 14.2221 0 12.8585V11.2511C2.40928e-06 9.87711 0.463526 8.54479 1.31308 7.47688L6.66804 0.745592C6.98662 0.345136 7.44414 0.08434 7.94623 0.0171605C8.4483 -0.0500155 8.95656 0.0815891 9.36603 0.384603ZM8.37542 1.77064C8.31492 1.72587 8.23987 1.70646 8.16579 1.71637C8.09171 1.72628 8.02415 1.76477 7.97708 1.82393L2.62213 8.55522C2.0153 9.31801 1.68421 10.2697 1.68421 11.2511V12.8585C1.68421 13.7676 2.03909 14.6394 2.67079 15.2822C3.30249 15.925 4.15927 16.2862 5.05263 16.2862H11.7895C12.4595 16.2862 13.1021 16.0153 13.5759 15.5332C14.0496 15.0511 14.3158 14.3972 14.3158 13.7154V10.2877C14.3158 9.83321 14.1383 9.39729 13.8225 9.07588C13.5066 8.75448 13.0783 8.57392 12.6316 8.57392H8C7.71763 8.57392 7.45405 8.4299 7.29806 8.19039C7.14206 7.95087 7.11442 7.64774 7.22445 7.38311L8.88886 3.37986C9 3.11253 9.01896 2.81477 8.94262 2.53507C8.8663 2.25541 8.69921 2.01027 8.46853 1.83954L8.37542 1.77064Z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <button
        aria-label="No"
        class="bg-secondary-button dark:bg-secondary-button-dark rounded-lg text-primary dark:text-primary-dark px-3"
      >
        <svg
          width="16"
          height="18"
          viewBox="0 0 16 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M6.63397 17.6154C6.63395 17.6154 6.63399 17.6154 6.63397 17.6154L6.54098 17.5466C6.00268 17.1482 5.61269 16.5761 5.43458 15.9235C5.25648 15.2709 5.30069 14.5761 5.56004 13.9524L6.72935 11.1399L3.36842 11.1399C2.47506 11.1399 1.61829 10.7788 0.986585 10.136C0.354883 9.49316 8.1991e-07 8.62132 8.99384e-07 7.71225L1.19904e-06 4.28458C1.29838e-06 3.14824 0.443605 2.05844 1.23323 1.25492C2.02286 0.451403 3.09383 -1.12829e-06 4.21053 -1.03067e-06L10.9474 -4.41715e-07C12.2874 -3.24565e-07 13.5726 0.541687 14.5201 1.50591C15.4677 2.47013 16 3.77789 16 5.1415L16 6.74893C16 8.12289 15.5365 9.45521 14.6869 10.5231L9.33196 17.2544C9.01338 17.6549 8.55586 17.9157 8.05377 17.9828C7.5517 18.05 7.04344 17.9184 6.63397 17.6154ZM7.62458 16.2294C7.68508 16.2741 7.76013 16.2935 7.83421 16.2836C7.90829 16.2737 7.97585 16.2352 8.02292 16.1761L13.3779 9.44478C13.9847 8.68199 14.3158 7.73033 14.3158 6.74892L14.3158 5.1415C14.3158 4.23242 13.9609 3.36058 13.3292 2.71777C12.6975 2.07496 11.8407 1.71383 10.9474 1.71383L4.21053 1.71383C3.5405 1.71383 2.89793 1.98468 2.42415 2.46679C1.95038 2.94889 1.68421 3.60277 1.68421 4.28458L1.68421 7.71225C1.68421 8.16679 1.86166 8.60271 2.1775 8.92411C2.49335 9.24552 2.92174 9.42608 3.36842 9.42608L8 9.42608C8.28237 9.42608 8.54595 9.5701 8.70195 9.80961C8.85794 10.0491 8.88558 10.3523 8.77555 10.6169L7.11114 14.6201C7 14.8875 6.98105 15.1852 7.05738 15.4649C7.1337 15.7446 7.30079 15.9897 7.53147 16.1605L7.62458 16.2294Z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
    </div>
  );
}

function NavItem(props) {
  return (
    <li>
      <NavLink
        class="p-2 pr-2 w-full rounded-none lg:rounded-r-lg text-left relative flex items-center justify-between pl-5 text-base"
        {...props}
        inactiveClass="text-secondary dark:text-secondary-dark hover:bg-gray-50 dark:hover:bg-gray-800"
        activeClass="text-link dark:text-link-dark bg-highlight dark:bg-highlight-dark border-blue-40 hover:bg-highlight hover:text-link dark:hover:bg-highlight-dark dark:hover:text-link-dark active"
      >
        {props.children}
      </NavLink>
    </li>
  );
}
