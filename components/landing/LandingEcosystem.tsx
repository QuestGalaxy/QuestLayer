import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, Compass } from 'lucide-react';
import { STORE_SLIDING_LINKS } from '../../constants';
import { fetchAllProjects } from '../../lib/supabase';
import { followLandingLink } from './links';

interface LandingEcosystemProps {
  onBrowse: () => void;
  onSubmitProject: () => void;
  onProjectDetails?: (projectId: string) => void;
}

type Project = Awaited<ReturnType<typeof fetchAllProjects>>[number];
const featuredDomains = ['raydium.io', 'galxe.com', 'phantom.app', 'daylight.xyz'];
const storeOrder = [...featuredDomains, ...STORE_SLIDING_LINKS.map(project => project.domain)];
const cacheDuration = 60_000;
let catalog: { expiresAt: number; request: Promise<Project[]> } | undefined;

function loadCatalog() {
  if (catalog && catalog.expiresAt > Date.now()) return catalog.request;

  const request = fetchAllProjects().catch(error => {
    if (catalog?.request === request) catalog = undefined;
    throw error;
  });
  catalog = { request, expiresAt: Date.now() + cacheDuration };
  return request;
}

function projectDomain(domain: string | null | undefined) {
  if (!domain) return '';
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/:?#]/, 1)[0];
}

function pickProjects(projects: Project[]) {
  const byDomain = new Map<string, Project>();
  for (const project of projects) {
    const domain = projectDomain(project.domain);
    if (project.id && project.name && domain && !byDomain.has(domain)) byDomain.set(domain, project);
  }

  const ordered = new Set<Project>();
  for (const domain of storeOrder) {
    const project = byDomain.get(domain);
    if (project) ordered.add(project);
  }
  for (const project of byDomain.values()) ordered.add(project);
  return Array.from(ordered).slice(0, 4);
}

export default function LandingEcosystem({ onBrowse, onSubmitProject, onProjectDetails }: LandingEcosystemProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    function requestCatalog() {
      loadCatalog().then(
        entries => {
          if (!mounted) return;
          setProjects(pickProjects(entries));
          setStatus('ready');
        },
        () => {
          if (mounted) setStatus('error');
        }
      );
    }

    const heading = headingRef.current;
    if (!heading || typeof IntersectionObserver === 'undefined') {
      requestCatalog();
      return () => { mounted = false; };
    }

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      requestCatalog();
    }, { rootMargin: '360px' });
    observer.observe(heading);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  return (
    <section className="ql-landing-section ql-ecosystem" id="ecosystem" aria-labelledby="ql-ecosystem-title">
      <div className="ql-ecosystem-intro" ref={headingRef}>
        <h2 id="ql-ecosystem-title">Discover projects on QuestLayer</h2>
        <p>Explore quests and campaigns in the Quest Store.</p>
        <div className="ql-ecosystem-actions">
          <a className="ql-landing-button ql-landing-button--primary ql-landing-button--small" href="/browse" onClick={event => followLandingLink(event, onBrowse)}>
            Browse Store <ArrowRight aria-hidden="true" />
          </a>
          <a className="ql-landing-text-link" href="/submit" onClick={event => followLandingLink(event, onSubmitProject)}>
            Submit a project
          </a>
        </div>
      </div>
      {projects.length > 0 ? (
        <ul className="ql-ecosystem-grid">
          {projects.map(project => (
            <li key={project.id}>
              <a
                className="ql-ecosystem-card"
                href={`/store/${project.id}`}
                onClick={event => onProjectDetails && followLandingLink(event, () => onProjectDetails(project.id))}
              >
                <span className="ql-ecosystem-art" aria-hidden="true">
                  <span>{project.name.trim().slice(0, 1).toUpperCase()}</span>
                  {project.banner_url || project.logo_url ? (
                    <img
                      src={project.banner_url || project.logo_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={event => { event.currentTarget.hidden = true; }}
                    />
                  ) : null}
                </span>
                <span className="ql-ecosystem-label">
                  <span><strong>{project.name}</strong><small>{projectDomain(project.domain)}</small></span>
                  <ArrowDownRight size={15} aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ql-ecosystem-empty">
          <Compass aria-hidden="true" />
          <p>{status === 'loading' ? 'Loading featured projects…' : status === 'error' ? 'Featured projects are temporarily unavailable.' : 'No featured projects yet.'}</p>
        </div>
      )}
    </section>
  );
}
