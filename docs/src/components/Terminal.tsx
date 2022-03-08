import { useLocation } from "solid-app-router";

useLocation
export default function Terminal() {
  return (
    <section className="my-8 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
      <div className="flex flex-col justify-center">
        <div className="rounded-lg bg-secondary dark:bg-gray-50 h-full">
          <div className="bg-gray-90 dark:bg-gray-60 w-full rounded-t-lg">
            <div className="text-primary-dark dark:text-primary-dark flex text-sm px-4 py-0.5 relative justify-between">
              <div>
                <svg
                  className="inline-flex mr-2 self-center"
                  width="1em"
                  height="1em"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.40299 2.61279H14.403C14.5798 2.61279 14.7494 2.68303 14.8744 2.80806C14.9994 2.93308 15.0697 3.10265 15.0697 3.27946V13.9461C15.0697 14.1229 14.9994 14.2925 14.8744 14.4175C14.7494 14.5426 14.5798 14.6128 14.403 14.6128H2.40299C2.22618 14.6128 2.05661 14.5426 1.93159 14.4175C1.80657 14.2925 1.73633 14.1229 1.73633 13.9461V3.27946C1.73633 3.10265 1.80657 2.93308 1.93159 2.80806C2.05661 2.68303 2.22618 2.61279 2.40299 2.61279ZM8.403 10.6128V11.9461H12.403V10.6128H8.403ZM6.01233 8.61279L4.12699 10.4981L5.06966 11.4415L7.89833 8.61279L5.06966 5.78413L4.12699 6.72746L6.01233 8.61279Z"
                    fill="currentColor"
                  />
                </svg>{" "}
                Terminal
              </div>
              <div>
                <button className="w-full text-left text-primary-dark dark:text-primary-dark ">
                  {/* */}Copy
                </button>
              </div>
            </div>
          </div>
          <div className="px-8 pt-4 pb-6 text-primary-dark dark:text-primary-dark font-mono text-code whitespace-pre">
            npm install react
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center">
        {/*$*/}
        <div
          translate="no"
          className="rounded-lg h-full w-full overflow-x-auto flex items-center bg-wash dark:bg-gray-95 shadow-lg"
        >
          <div className="sp-wrapper sp-sp-607024663">
            <div className="sp-stack">
              <pre className="sp-cm sp-pristine sp-javascript" translate="no">
                <div className="cm-editor ͼ1 ͼ2 ͼn">
                  <div aria-live="polite" style={{ position: "absolute", top: "-10000px" }} />
                  <div tabIndex={-1} className="cm-scroller">
                    <div
                      spellcheck={false}
                      autocapitalize="off"
                      translate="no"
                      contentEditable={false}
                      className="cm-content"
                      style={{ tabSize: 4 }}
                      role="textbox"
                      aria-multiline="true"
                      aria-readonly="true"
                      data-gramm="false"
                    >
                      <div className="cm-line">
                        <span className="ͼ10">// Importing a specific API:</span>
                      </div>
                      <div className="cm-line">
                        <span className="ͼr">import</span> <span className="ͼz">{"{"}</span>{" "}
                        <span className="ͼu">useState</span> <span className="ͼz">{"}"}</span>{" "}
                        <span className="ͼr">from</span> <span className="ͼy">'react'</span>
                        <span className="ͼz">;</span>
                      </div>
                      <div className="cm-line">
                        <br />
                      </div>
                      <div className="cm-line">
                        <span className="ͼ10">// Importing all APIs together:</span>
                      </div>
                      <div className="cm-line">
                        <span className="ͼr">import</span> <span className="ͼr">*</span>{" "}
                        <span className="ͼr">as</span> <span className="ͼu">React</span>{" "}
                        <span className="ͼr">from</span> <span className="ͼy">'react'</span>
                        <span className="ͼz">;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </pre>
            </div>
          </div>
        </div>
        {/*/$*/}
      </div>
    </section>
  );
}
