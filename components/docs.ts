export const docs = import.meta.glob<
  true,
  any,
  {
    getHeadings: () => {
      depth: number;
      text: string;
      slug: string;
    }[];
    getFrontMatter: () => {
      title?: string;
      sectionTitle?: string;
      order?: number;
      section?: string;
      sectionOrder?: number;
      subsection?: string;
    };
  }
>("../docs/**/*.{md,mdx}", {
  eager: true,
  query: {
    meta: ""
  }
});

export function buildSections() {
  let sections: {
    [key: string]: {
      title: string;
      path: string;
      order: number;
      subsection: string;
      href: string;
    }[] & { subsection?: Set<string>; title?: string; order?: number };
  } = {};
  Object.keys(docs).forEach(key => {
    let frontMatter = docs[key].getFrontMatter();
    let {
      title = docs[key].getHeadings().find(h => h.depth === 1)?.text ?? "",
      section = "",
      order = 100
    } = frontMatter ?? {};
    if (!sections[section]) {
      sections[section] = [];
    }

    if (frontMatter?.subsection) {
      if (!sections[section].subsection) {
        sections[section].subsection = new Set();
      }
      sections[section].subsection.add(frontMatter.subsection);
    }

    if (frontMatter?.sectionTitle) {
      sections[section].title = frontMatter.sectionTitle;
    }

    if (frontMatter?.sectionOrder) {
      sections[section].order = frontMatter.sectionOrder;
    }

    sections[section].push({
      title,
      path: key,
      order,
      subsection: frontMatter?.subsection,
      href: key.slice(7).replace(/\.mdx?$/, "")
    });
  });

  Object.keys(sections).forEach(key => {
    sections[key].sort((a, b) => a.order - b.order);
  });

  return Object.values(sections).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
