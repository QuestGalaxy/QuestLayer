import fs from 'node:fs/promises';
import path from 'node:path';
import {
  site,
  corePages,
  featurePages,
  useCasePages,
  templatePages,
  docsPages
} from '../seo/seo-content.mjs';

const root = path.resolve(process.cwd(), 'public');

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

const renderMeta = ({ title, description, path: pagePath }) => {
  const url = pageUrl(pagePath);
  const image = site.ogImage.startsWith('http') ? site.ogImage : `${site.baseUrl}${site.ogImage}`;

  return `\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>${title}</title>\n    <meta name="title" content="${title}">\n    <meta name="description" content="${description}">\n    <link rel="canonical" href="${url}">\n\n    <meta property="og:type" content="website">\n    <meta property="og:title" content="${title}">\n    <meta property="og:description" content="${description}">\n    <meta property="og:url" content="${url}">\n    <meta property="og:image" content="${image}">\n\n    <meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="${title}">\n    <meta name="twitter:description" content="${description}">\n    <meta name="twitter:image" content="${image}">\n    <meta name="theme-color" content="#0b1020">\n    <link rel="icon" href="/logoLayer.webp" type="image/webp">\n    <link rel="apple-touch-icon" href="/logoLayer.webp">\n    <link rel="stylesheet" href="/seo.css">\n    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">\n    <script async src="https://www.googletagmanager.com/gtag/js?id=G-26XSSG4VLF"></script>\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', 'G-26XSSG4VLF');\n    </script>\n`;
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

const renderHeader = () => `\n  <header class="site-header">\n    <div class="container">\n      <a class="brand" href="/">\n        <span class="brand-mark">Q</span>\n        <span class="brand-text">QuestLayer</span>\n      </a>\n      <nav class="nav">\n        <a href="/features">Features</a>\n        <a href="/use-cases">Use cases</a>\n        <a href="/templates">Templates</a>\n        <a href="/docs">Docs</a>\n      </nav>\n      <div class="nav-cta">\n        <a class="btn ghost" href="/builder">Open builder</a>\n        <a class="btn primary" href="${site.dashboardUrl}">Create your widget</a>\n      </div>\n    </div>\n  </header>\n`;

const renderFooter = () => `\n  <footer class="site-footer">\n    <div class="container footer-grid">\n      <div>\n        <div class="brand muted">QuestLayer</div>\n        <p class="muted">Embed quests, tasks, and rewards anywhere. Product-led SEO, no fluff.</p>\n      </div>\n      <div class="footer-links">\n        <a href="/quest-widget">Quest widget</a>\n        <a href="/task-widget">Task widget</a>\n        <a href="/templates">Templates</a>\n        <a href="/docs">Docs</a>\n      </div>\n      <div class="footer-links">\n        <a href="/use-cases/web3">Web3</a>\n        <a href="/use-cases/saas">SaaS</a>\n        <a href="/use-cases/community">Community</a>\n        <a href="/features/quests">Quest campaigns</a>\n      </div>\n    </div>\n  </footer>\n`;

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
    path: `/${page.slug}`
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>\n      ${renderHero({
        kicker: 'Core category',
        title: page.keyword,
        description: page.definition,
        secondaryHref: '/templates',
        secondaryCta: 'Browse templates'
      })}\n      ${renderSection(
        'How it works',
        `<ol class="steps">${steps}\n        </ol>`
      )}\n      ${renderSection('Benefits', `<ul class="list">${benefits}</ul>`)}\n      ${renderSection('Use cases', renderCardGrid(useCaseCards))}\n      ${renderSection('Templates to launch fast', renderCardGrid(templateCards))}\n      ${renderSection('Features that power this widget', renderCardGrid(featureCards))}\n      ${renderSection('Docs to go deeper', renderCardGrid(docCards))}\n      ${renderSection('FAQ', `<div class="faq">${faqs}</div>`)}\n      <section class="cta-section">\n        <div class="container cta-panel">\n          <div>\n            <h2>Create your ${page.keyword} today</h2>\n            <p>Spin up a widget in minutes and embed it on any site.</p>\n          </div>\n          <a class="btn primary" href="${site.dashboardUrl}">Create your widget</a>\n        </div>\n      </section>\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
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

  return `<!DOCTYPE html>\n<html lang="en">\n<head>${renderMeta({
    title: `${page.title} | QuestLayer docs`,
    description: page.description,
    path: `/docs/${page.slug}`
  })}\n${schemas}\n</head>\n<body>\n  <div class="page">${renderHeader()}\n    <main>\n      ${renderHero({
        kicker: 'Docs',
        title: page.title,
        description: page.description,
        secondaryHref: '/docs',
        secondaryCta: 'Docs home'
      })}\n      ${renderSection('Steps', `<ul class="list">${steps}</ul>`)}\n      ${renderSection('Tips', `<ul class="list">${tips}</ul>`)}\n      ${renderSection('Related product pages', renderCardGrid(relatedCards))}\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
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
      })}\n      ${renderSection('Browse', renderCardGrid(cards))}\n    </main>\n${renderFooter()}\n  </div>\n</body>\n</html>`;
};

const writePage = async (filePath, content) => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
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

  const urls = [
    '/',
    ...corePages.map((page) => `/${page.slug}`),
    '/features',
    ...featurePages.map((page) => `/features/${page.slug}`),
    '/use-cases',
    ...useCasePages.map((page) => `/use-cases/${page.slug}`),
    '/templates',
    ...templatePages.map((page) => `/templates/${page.slug}`),
    '/docs',
    ...docsPages.map((page) => `/docs/${page.slug}`)
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
