import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  site,
  corePages,
  featurePages,
  useCasePages,
  templatePages,
  docsPages,
  integrationPages,
  comparisonPages
} from '../seo/seo-content.mjs';

const root = path.resolve(process.cwd(), 'public');

const loadEnvFile = async (filepath) => {
  try {
    const raw = await fs.readFile(filepath, 'utf8');
    const entries = raw.split('\n');
    const env = {};
    for (const line of entries) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
};

const toMap = (list) =>
  list.reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {});

const featureMap = toMap(featurePages);
const useCaseMap = toMap(useCasePages);
const templateMap = toMap(templatePages);
const docsMap = toMap(docsPages);

const ensureDir = (dir) => fs.mkdir(dir, { recursive: true });

const pageUrl = (pathname) => `${site.baseUrl}${pathname}`;

const renderMeta = ({ title, description, path: pagePath, keywords = [] }) => {
  const url = pageUrl(pagePath);
  const image = site.ogImage.startsWith('http') ? site.ogImage : `${site.baseUrl}${site.ogImage}`;
  const keywordsMeta = keywords.length > 0 ? `\n    <meta name="keywords" content="${keywords.join(', ')}">` : '';

  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="title" content="${title}">
    <meta name="description" content="${description}">${keywordsMeta}
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="theme-color" content="#0b1020">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="stylesheet" href="/seo.css">
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-26XSSG4VLF"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-26XSSG4VLF');
    </script>
`;
};

const renderJsonLd = (schemas) =>
  schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n');

const renderBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: pageUrl(item.path)
  }))
});

const renderSoftwareAppSchema = (page) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${site.name} ${page.keyword}`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: page.description,
  url: pageUrl(`/${page.slug}`),
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Start free in the QuestLayer dashboard.'
  }
});

const renderFaqSchema = (page) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: page.faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

const renderTechArticleSchema = (page, pagePath) => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: page.title,
  description: page.description,
  url: pageUrl(pagePath),
  author: {
    '@type': 'Organization',
    name: site.name
  },
  publisher: {
    '@type': 'Organization',
    name: site.name
  },
  datePublished: '2025-01-15',
  dateModified: '2025-01-15'
});

const renderHeader = () => `\n  <header class="site-header">\n    <div class="container">\n      <a class="brand" href="/">\n        <span class="brand-mark">Q</span>\n        <span class="brand-text">QuestLayer</span>\n      </a>\n      <nav class="nav">\n        <a href="/features">Features</a>\n        <a href="/use-cases">Use cases</a>\n        <a href="/templates">Templates</a>\n        <a href="/docs">Docs</a>\n        <a href="/comparisons">Comparisons</a>\n      </nav>\n      <div class="nav-cta">\n        <a class="btn ghost" href="/builder">Open builder</a>\n        <a class="btn primary" href="${site.dashboardUrl}">Create your widget</a>\n      </div>\n    </div>\n  </header>\n`;

const renderFooter = () => `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="brand muted">QuestLayer</div>
        <p class="muted">Embed quests, tasks, and rewards anywhere. Product-led SEO, no fluff.</p>
      </div>
      <div class="footer-links">
        <a href="/quest-widget">Quest widget</a>
        <a href="/task-widget">Task widget</a>
        <a href="/templates">Templates</a>
        <a href="/docs">Docs</a>
        <a href="/comparisons">Comparisons</a>
      </div>
      <div class="footer-links">
        <a href="/use-cases/web3">Web3</a>
        <a href="/use-cases/saas">SaaS</a>
        <a href="/use-cases/community">Community</a>
        <a href="/features/quests">Quest campaigns</a>
      </div>
    </div>
  </footer>
`;

const renderHeroMedia = () => `\n    <div class="hero-media">\n      <div class="media-frame">\n        <img src="/qlayer.jpeg" alt="QuestLayer widget preview" loading="lazy">\n        <div class="media-glow"></div>\n      </div>\n    </div>\n`;

const renderBreadcrumbs = (items) => {
  const crumbs = items
    .map((item, index) => {
      if (index === items.length - 1) {
        return `<span>${item.name}</span>`;
      }
      return `<a href="${item.path}">${item.name}</a>`;
    })
    .join('<span class="sep">/</span>');
  return `<div class="breadcrumbs">${crumbs}</div>`;
};

const renderCardGrid = (items) => `\n    <div class="grid">${items.join('')}\n    </div>`;

const renderLinkCard = ({ title, description, href, tag }) => `\n      <a class="card" href="${href}">\n        <div class="card-tag">${tag}</div>\n        <h3>${title}</h3>\n        <p>${description}</p>\n      </a>`;

const renderSection = (title, body) => `\n  <section class="section">\n    <div class="container">\n      <h2>${title}</h2>\n      ${body}\n    </div>\n  </section>`;

const renderHero = ({
  kicker,
  title,
  description,
  primaryCta = 'Create your widget',
  secondaryCta = 'See templates',
  secondaryHref = '/templates'
}) => `\n  <section class="hero">\n    <div class="container hero-grid">\n      <div>\n        <div class="tag">${kicker}</div>\n        <h1>${title}</h1>\n        <p class="lead">${description}</p>\n        <div class="cta-row">\n          <a class="btn primary" href="${site.dashboardUrl}">${primaryCta}</a>\n          <a class="btn ghost" href="${secondaryHref}">${secondaryCta}</a>\n        </div>\n      </div>\n      ${renderHeroMedia()}\n    </div>\n  </section>`;

const renderCorePage = (page) => {
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: page.keyword, path: `/${page.slug}` }
  ];

  const featureCards = page.features.map((slug) => {
    const feature = featureMap[slug];
    return renderLinkCard({
      title: feature.title,
      description: feature.description,
      href: `/features/${feature.slug}`,
      tag: 'Feature'
    });
  });

  const docCards = page.docs.map((slug) => {
    const doc = docsMap[slug];
    return renderLinkCard({
      title: doc.title,
      description: doc.description,
      href: `/docs/${doc.slug}`,
      tag: 'Docs'
    });
  });

  const templateCards = page.templates.map((slug) => {
    const template = templateMap[slug];
    return renderLinkCard({
      title: template.title,
      description: template.description,
      href: `/templates/${template.slug}`,
      tag: 'Template'
    });
  });

  const useCaseCards = page.useCases.map((slug) => {
    const useCase = useCaseMap[slug];
    return renderLinkCard({
      title: useCase.title,
      description: useCase.description,
      href: `/use-cases/${useCase.slug}`,
      tag: 'Use case'
    });
  });

  const comparisonCards = comparisonPages
    .filter((comp) => comp.relatedCore.includes(page.slug))
    .map((comp) =>
      renderLinkCard({
        title: comp.keyword,
        description: comp.description,
        href: `/comparisons/${comp.slug}`,
        tag: 'Comparison'
      })
    );

  const steps = page.steps
    .map(
      (step, index) => `\n        <li>\n          <div class="step-index">0${index + 1}</div>\n          <p>${step}</p>\n        </li>`
    )
    .join('');

  const benefits = page.benefits.map((benefit) => `<li>${benefit}</li>`).join('');

  const faqs = page.faqs
    .map(
      (faq) => `\n        <details class="faq-item">\n          <summary>${faq.question}</summary>\n          <p>${faq.answer}</p>\n        </details>`
    )
    .join('');

  const schemas = renderJsonLd([
    renderSoftwareAppSchema(page),
    renderFaqSchema(page),
    renderBreadcrumbSchema(breadcrumbItems)
  ]);

  return `<!DOCTYPE html>\n<html lang="en">\n<head>${renderMeta({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
    keywords: page.secondaryKeywords || []
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>
      ${renderHero({
        kicker: 'Core category',
        title: page.keyword,
        description: page.definition,
        secondaryHref: '/templates',
        secondaryCta: 'Store templates'
      })}
      ${renderSection(
        `How our ${page.keyword} works`,
        `<ol class="steps">${steps}
        </ol>`
      )}
      ${renderSection(`Benefits of using a ${page.keyword}`, `<ul class="list">${benefits}</ul>`)}
      ${comparisonCards.length > 0 ? renderSection('Comparisons', renderCardGrid(comparisonCards)) : ''}
      ${renderSection('Use cases', renderCardGrid(useCaseCards))}\n      ${renderSection('Templates to launch fast', renderCardGrid(templateCards))}\n      ${renderSection('Features that power this widget', renderCardGrid(featureCards))}\n      ${renderSection('Docs to go deeper', renderCardGrid(docCards))}\n      ${renderSection('FAQ', `<div class="faq">${faqs}</div>`)}\n      <section class="cta-section">\n        <div class="container cta-panel">\n          <div>\n            <h2>Create your ${page.keyword} today</h2>\n            <p>Spin up a widget in minutes and embed it on any site.</p>\n          </div>\n          <a class="btn primary" href="${site.dashboardUrl}">Create your widget</a>\n        </div>\n      </section>\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
};

const renderFeaturePage = (page) => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: page.title, path: `/features/${page.slug}` }
  ];

  const relatedCards = page.relatedCore.map((slug) => {
    const core = corePages.find((item) => item.slug === slug);
    return renderLinkCard({
      title: core.keyword,
      description: core.description,
      href: `/${core.slug}`,
      tag: 'Core'
    });
  });

  const templates = templatePages.slice(0, 2).map((template) =>
    renderLinkCard({
      title: template.title,
      description: template.description,
      href: `/templates/${template.slug}`,
      tag: 'Template'
    })
  );

  const docs = docsPages.slice(0, 2).map((doc) =>
    renderLinkCard({
      title: doc.title,
      description: doc.description,
      href: `/docs/${doc.slug}`,
      tag: 'Docs'
    })
  );

  const highlights = page.highlights.map((item) => `<li>${item}</li>`).join('');

  const schemas = renderJsonLd([renderBreadcrumbSchema(breadcrumbs)]);

  return `<!DOCTYPE html>\n<html lang="en">\n<head>${renderMeta({
    title: `${page.title} | QuestLayer features`,
    description: page.description,
    path: `/features/${page.slug}`
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>\n      ${renderHero({
        kicker: 'Feature',
        title: page.title,
        description: page.description,
        secondaryHref: '/features',
        secondaryCta: 'All features'
      })}\n      ${renderSection('What you can build', `<ul class="list">${highlights}</ul>`)}\n      ${renderSection('Core pages connected to this feature', renderCardGrid(relatedCards))}\n      ${renderSection('Templates to start with', renderCardGrid(templates))}\n      ${renderSection('Docs to help you launch', renderCardGrid(docs))}\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
};

const useCaseLinks = {
  web3: {
    core: ['web3-quest-widget', 'quest-widget'],
    templates: ['nft-holder-only', 'discord-join'],
    features: ['wallet-login', 'nft-gating']
  },
  saas: {
    core: ['task-widget', 'daily-task-widget'],
    templates: ['daily-login', 'twitter-share'],
    features: ['tasks', 'streaks']
  },
  community: {
    core: ['embed-quests', 'rewards-widget'],
    templates: ['discord-join', 'referral-campaign'],
    features: ['quests', 'referrals']
  },
  games: {
    core: ['gamification-widget', 'streak-widget'],
    templates: ['daily-login', 'referral-campaign'],
    features: ['xp', 'streaks']
  },
  ecommerce: {
    core: ['rewards-widget', 'task-widget'],
    templates: ['twitter-share', 'referral-campaign'],
    features: ['rewards', 'referrals']
  },
  education: {
    core: ['daily-task-widget', 'streak-widget'],
    templates: ['daily-login', 'discord-join'],
    features: ['tasks', 'streaks']
  }
};

const renderUseCasePage = (page) => {
  const links = useCaseLinks[page.slug];
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Use cases', path: '/use-cases' },
    { name: page.title, path: `/use-cases/${page.slug}` }
  ];

  const coreCards = links.core.map((slug) => {
    const core = corePages.find((item) => item.slug === slug);
    return renderLinkCard({
      title: core.keyword,
      description: core.description,
      href: `/${core.slug}`,
      tag: 'Core'
    });
  });

  const templateCards = links.templates.map((slug) => {
    const template = templateMap[slug];
    return renderLinkCard({
      title: template.title,
      description: template.description,
      href: `/templates/${template.slug}`,
      tag: 'Template'
    });
  });

  const featureCards = links.features.map((slug) => {
    const feature = featureMap[slug];
    return renderLinkCard({
      title: feature.title,
      description: feature.description,
      href: `/features/${feature.slug}`,
      tag: 'Feature'
    });
  });

  const outcomes = page.outcomes.map((item) => `<li>${item}</li>`).join('');

  const schemas = renderJsonLd([renderBreadcrumbSchema(breadcrumbs)]);

  return `<!DOCTYPE html>\n<html lang="en">\n<head>${renderMeta({
    title: `${page.title} quests | QuestLayer use case`,
    description: page.description,
    path: `/use-cases/${page.slug}`
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>\n      ${renderHero({
        kicker: 'Use case',
        title: page.title,
        description: page.description,
        secondaryHref: '/use-cases',
        secondaryCta: 'All use cases'
      })}\n      ${renderSection('Outcomes you can drive', `<ul class="list">${outcomes}</ul>`)}\n      ${renderSection('Recommended widgets', renderCardGrid(coreCards))}\n      ${renderSection('Suggested templates', renderCardGrid(templateCards))}\n      ${renderSection('Helpful features', renderCardGrid(featureCards))}\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
};

const renderTemplatePage = (page) => {
  const core = corePages.find((item) => item.slug === page.coreLink);
  const feature = featureMap[page.featureLink];

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Templates', path: '/templates' },
    { name: page.title, path: `/templates/${page.slug}` }
  ];

  const preview = page.preview.map((item) => `<li>${item}</li>`).join('');

  const schemas = renderJsonLd([renderBreadcrumbSchema(breadcrumbs)]);

  return `<!DOCTYPE html>\n<html lang="en">\n<head>${renderMeta({
    title: `${page.title} template | QuestLayer`,
    description: page.description,
    path: `/templates/${page.slug}`
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>\n      ${renderHero({
        kicker: 'Template',
        title: page.title,
        description: page.description,
        secondaryHref: '/templates',
        secondaryCta: 'All templates'
      })}\n      ${renderSection('What this template includes', `<ul class="list">${preview}</ul>`)}\n      ${renderSection(
        'Configuration preview',
        `<pre class="code">{\n  template: \"${page.slug}\",\n  rewards: \"XP + perks\",\n  cadence: \"Daily or weekly\"\n}</pre>`
      )}\n      ${renderSection(
        'Use this template',
        `<div class="cta-inline">\n          <p>Launch this template in your dashboard and customize tasks in minutes.</p>\n          <a class="btn primary" href="${site.dashboardUrl}">Use this template</a>\n        </div>`
      )}\n      ${renderSection(
        'Related pages',
        renderCardGrid([
          renderLinkCard({
            title: core.keyword,
            description: core.description,
            href: `/${core.slug}`,
            tag: 'Core'
          }),
          renderLinkCard({
            title: feature.title,
            description: feature.description,
            href: `/features/${feature.slug}`,
            tag: 'Feature'
          })
        ])
      )}\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
};

const renderDocsPage = (page) => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Docs', path: '/docs' },
    { name: page.title, path: `/docs/${page.slug}` }
  ];

  const steps = page.steps.map((item) => `<li>${item}</li>`).join('');
  const tips = page.tips.map((item) => `<li>${item}</li>`).join('');

  const relatedCards = page.relatedCore.map((slug) => {
    const core = corePages.find((item) => item.slug === slug);
    return renderLinkCard({
      title: core.keyword,
      description: core.description,
      href: `/${core.slug}`,
      tag: 'Core'
    });
  });

  const schemas = renderJsonLd([
    renderTechArticleSchema(page, `/docs/${page.slug}`),
    renderBreadcrumbSchema(breadcrumbs)
  ]);

  return `<!DOCTYPE html>
<html lang="en">
<head>${renderMeta({
    title: `${page.title} | QuestLayer docs`,
    description: page.description,
    path: `/docs/${page.slug}`
  })}
${schemas}
</head>
<body>
  <div class="page">${renderHeader()}
    <main>
      ${renderHero({
        kicker: 'Docs',
        title: page.title,
        description: page.description,
        secondaryHref: '/docs',
        secondaryCta: 'Docs home'
      })}
      ${renderSection('Steps', `<ul class="list">${steps}</ul>`)}
      ${renderSection('Tips', `<ul class="list">${tips}</ul>`)}
      ${renderSection('Related product pages', renderCardGrid(relatedCards))}
    </main>
${renderFooter()}
  </div>
</body>
</html>`;
};

const renderIntegrationPage = (page) => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Integrations', path: '/integrations' },
    { name: page.title, path: `/integrations/${page.slug}` }
  ];

  const steps = page.steps
    .map(
      (step, index) => `
        <li>
          <div class="step-index">0${index + 1}</div>
          <p>${step}</p>
        </li>`
    )
    .join('');

  const benefits = page.benefits.map((benefit) => `<li>${benefit}</li>`).join('');

  const relatedCards = page.relatedCore.map((slug) => {
    const core = corePages.find((item) => item.slug === slug);
    return renderLinkCard({
      title: core.keyword,
      description: core.description,
      href: `/${core.slug}`,
      tag: 'Core'
    });
  });

  const docCards = page.docs.map((slug) => {
    const doc = docsMap[slug];
    return renderLinkCard({
      title: doc.title,
      description: doc.description,
      href: `/docs/${doc.slug}`,
      tag: 'Docs'
    });
  });

  const schemas = renderJsonLd([
    renderSoftwareAppSchema({
      ...page,
      keyword: page.title,
      slug: `integrations/${page.slug}`
    }),
    renderBreadcrumbSchema(breadcrumbs)
  ]);

  return `<!DOCTYPE html>
<html lang="en">
<head>${renderMeta({
    title: `${page.title} | QuestLayer Integrations`,
    description: page.description,
    path: `/integrations/${page.slug}`
  })}
${schemas}
</head>
<body>
  <div class="page">${renderHeader()}
    <main>
      ${renderHero({
        kicker: 'Integration',
        title: page.title,
        description: page.description,
        secondaryHref: '/integrations',
        secondaryCta: 'All integrations'
      })}
      ${renderSection(
        'Integration steps',
        `<ol class="steps">${steps}
        </ol>`
      )}
      ${renderSection('Benefits', `<ul class="list">${benefits}</ul>`)}
      ${renderSection('Related widgets', renderCardGrid(relatedCards))}
      ${renderSection('Documentation', renderCardGrid(docCards))}
    </main>
${renderFooter()}
  </div>
</body>
</html>`;
};

const renderComparisonPage = (page) => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Comparisons', path: '/comparisons' },
    { name: page.title, path: `/comparisons/${page.slug}` }
  ];

  const comparisonRows = page.comparison
    .map(
      (row) => `
        <tr>
          <td>${row.feature}</td>
          <td><strong>${row.ql}</strong></td>
          <td>${row.competitor}</td>
        </tr>`
    )
    .join('');

  const relatedCards = page.relatedCore.map((slug) => {
    const core = corePages.find((item) => item.slug === slug);
    return renderLinkCard({
      title: core.keyword,
      description: core.description,
      href: `/${core.slug}`,
      tag: 'Core'
    });
  });

  const schemas = renderJsonLd([renderBreadcrumbSchema(breadcrumbs)]);

  return `<!DOCTYPE html>
<html lang="en">
<head>${renderMeta({
    title: page.title,
    description: page.description,
    path: `/comparisons/${page.slug}`
  })}
${schemas}
</head>
<body>
  <div class="page">${renderHeader()}
    <main>
      ${renderHero({
        kicker: 'Comparison',
        title: page.keyword,
        description: page.definition,
        secondaryHref: '/comparisons',
        secondaryCta: 'All comparisons'
      })}
      ${renderSection(
        'Feature Comparison',
        `<table class="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>QuestLayer</th>
              <th>Alternative</th>
            </tr>
          </thead>
          <tbody>
            ${comparisonRows}
          </tbody>
        </table>`
      )}
      ${renderSection('Why choose QuestLayer?', `<p class="lead">${page.definition}</p>`)}
      ${renderSection('Related widgets', renderCardGrid(relatedCards))}
    </main>
${renderFooter()}
  </div>
</body>
</html>`;
};

const renderIndexPage = ({
  title,
  description,
  path: pagePath,
  kicker,
  items,
  itemTag
}) => {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: title, path: pagePath }
  ];

  const cards = items.map((item) =>
    renderLinkCard({
      title: item.title || item.keyword,
      description: item.description,
      href: `${pagePath}/${item.slug}`,
      tag: itemTag
    })
  );

  const schemas = renderJsonLd([renderBreadcrumbSchema(breadcrumbs)]);

  return `<!DOCTYPE html>\n<html lang="en">\n<head>${renderMeta({
    title: `${title} | QuestLayer`,
    description,
    path: pagePath
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>\n      ${renderHero({
        kicker,
        title,
        description,
        secondaryHref: '/quest-widget',
        secondaryCta: 'See core widgets'
      })}\n      ${renderSection('Store', renderCardGrid(cards))}\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
};

const writePage = async (filePath, content) => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
};

const fetchProjectPaths = async () => {
  const envFromFile = await loadEnvFile(path.join(process.cwd(), '.env.local'));
  const supabaseUrl = process.env.VITE_SUPABASE_URL || envFromFile.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envFromFile.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return [];

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !data) return [];
  return data.map((project) => `/store/${project.id}`);
};

const generate = async () => {
  await Promise.all(
    corePages.map((page) =>
      writePage(path.join(root, page.slug, 'index.html'), renderCorePage(page))
    )
  );

  await Promise.all(
    featurePages.map((page) =>
      writePage(path.join(root, 'features', page.slug, 'index.html'), renderFeaturePage(page))
    )
  );

  await Promise.all(
    useCasePages.map((page) =>
      writePage(path.join(root, 'use-cases', page.slug, 'index.html'), renderUseCasePage(page))
    )
  );

  await Promise.all(
    templatePages.map((page) =>
      writePage(path.join(root, 'templates', page.slug, 'index.html'), renderTemplatePage(page))
    )
  );

  await Promise.all(
    docsPages.map((page) =>
      writePage(path.join(root, 'docs', page.slug, 'index.html'), renderDocsPage(page))
    )
  );

  await Promise.all(
    integrationPages.map((page) =>
      writePage(path.join(root, 'integrations', page.slug, 'index.html'), renderIntegrationPage(page))
    )
  );

  await Promise.all(
    comparisonPages.map((page) =>
      writePage(path.join(root, 'comparisons', page.slug, 'index.html'), renderComparisonPage(page))
    )
  );

  await writePage(
    path.join(root, 'comparisons', 'index.html'),
    renderIndexPage({
      title: 'Comparisons',
      description: 'See how QuestLayer stacks up against other quest and gamification platforms.',
      path: '/comparisons',
      kicker: 'Platform comparisons',
      items: comparisonPages,
      itemTag: 'Comparison'
    })
  );

  await writePage(
    path.join(root, 'templates', 'index.html'),
    renderIndexPage({
      title: 'Templates',
      description: 'Pick a QuestLayer template to launch fast with proven task flows.',
      path: '/templates',
      kicker: 'Template library',
      items: templatePages,
      itemTag: 'Template'
    })
  );

  await writePage(
    path.join(root, 'docs', 'index.html'),
    renderIndexPage({
      title: 'Docs',
      description: 'Guides for embedding, theming, and scaling QuestLayer widgets.',
      path: '/docs',
      kicker: 'Documentation',
      items: docsPages,
      itemTag: 'Docs'
    })
  );

  await writePage(
    path.join(root, 'integrations', 'index.html'),
    renderIndexPage({
      title: 'Integrations',
      description: 'QuestLayer integrations with your favorite frameworks and tools.',
      path: '/integrations',
      kicker: 'Integration library',
      items: integrationPages,
      itemTag: 'Integration'
    })
  );

  await writePage(
    path.join(root, 'features', 'index.html'),
    renderIndexPage({
      title: 'Features',
      description: 'Explore the QuestLayer feature set powering quests, tasks, and rewards.',
      path: '/features',
      kicker: 'Feature catalog',
      items: featurePages,
      itemTag: 'Feature'
    })
  );

  await writePage(
    path.join(root, 'use-cases', 'index.html'),
    renderIndexPage({
      title: 'Use cases',
      description: 'See how teams use QuestLayer widgets across industries.',
      path: '/use-cases',
      kicker: 'Use case library',
      items: useCasePages,
      itemTag: 'Use case'
    })
  );

  const projectPaths = await fetchProjectPaths();
  const urls = [
    '/',
    '/terms',
    '/privacy',
    '/browse',
    ...corePages.map((page) => `/${page.slug}`),
    '/features',
    ...featurePages.map((page) => `/features/${page.slug}`),
    '/use-cases',
    ...useCasePages.map((page) => `/use-cases/${page.slug}`),
    '/templates',
    ...templatePages.map((page) => `/templates/${page.slug}`),
    '/docs',
    ...docsPages.map((page) => `/docs/${page.slug}`),
    '/integrations',
    ...integrationPages.map((page) => `/integrations/${page.slug}`),
    '/comparisons',
    ...comparisonPages.map((page) => `/comparisons/${page.slug}`),
    ...projectPaths
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) =>
        `  <url>\n    <loc>${pageUrl(url)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`;

  await writePage(path.join(root, 'sitemap.xml'), sitemap);

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${pageUrl('/sitemap.xml')}\n`;
  await writePage(path.join(root, 'robots.txt'), robots);
};

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
