// @refresh skip
import type { BuiltinLanguage, Highlighter } from 'shikiji';
import { getHighlighterCore, loadWasm } from 'shikiji/core';
import { createEffect, createResource, type JSX } from 'solid-js';

import url from 'shikiji/onig.wasm?url';

import langJS from 'shikiji/langs/javascript.mjs';
import langJSX from 'shikiji/langs/jsx.mjs';
import langTSX from 'shikiji/langs/tsx.mjs';
import langTS from 'shikiji/langs/typescript.mjs';
import darkPlus from 'shikiji/themes/dark-plus.mjs';

let HIGHLIGHTER: Highlighter;

async function loadHighlighter() {
  if (!HIGHLIGHTER) {
    await loadWasm(await fetch(url))
    HIGHLIGHTER = await getHighlighterCore({
      themes: [
        darkPlus,
      ],
      langs: [
        langJS,
        langJSX,
        langTS,
        langTSX,
      ],
    });
  }
  return HIGHLIGHTER;
}

export interface CodeViewProps {
  fileName: string;
  content: string;
  line: number;
}

const RANGE = 8;

export function CodeView(props: CodeViewProps): JSX.Element | null {
  const lines = () =>
    props.content.split('\n').map((item, index) => ({
      index: index + 1,
      line: item,
    }));

  const minLine = () => Math.max(props.line - (1 + RANGE), 0);
  const maxLine = () => Math.min(props.line + RANGE, lines().length - 1);

  let ref: HTMLDivElement | undefined;

  const [data] = createResource(() => (
    lines()
    .slice(minLine(), maxLine())
    .map(item => item.line)
    .join('\n')
  ) ,async (value) => {
    const highlighter = await loadHighlighter();
    const fileExtension = props.fileName
      .split(/[#?]/)[0]!
      .split('.')
      .pop()
      ?.trim();
    let lang = fileExtension as BuiltinLanguage;
    if (fileExtension === 'mjs' || fileExtension === 'cjs') {
      lang = 'js';
    }
    return highlighter.codeToHtml(value, {
      theme: 'dark-plus',
      lang,
    });
  });

  createEffect(() => {
    const result = data();
    if (ref && result) {
      ref.innerHTML = result;

      const lines = ref.querySelectorAll('span[class="line"]');

      for (let i = 0, len = lines.length; i < len; i++) {
        const el = lines[i] as HTMLElement;
        if ((props.line - minLine() - 1) === i) {
          el.classList.add('dev-overlay-error-line');
        }
      }
    }
  });

  return <div ref={ref} class="dev-overlay-code-view" style={{
    '--dev-overlay-code-view-start': minLine() + 1,
  }} />;
}
