import "./globals.css"
import './vote-refinements.css';
import './ui-upgrade.css';
import './premium-motion.css';
import {SurfaceDepth} from '@/components/surface-depth';
import bootstrap from '@/lib/generated/directory.json';
import {expandIndex,type CompactIndex} from '@/lib/directory-index';
import {Inter, Fraunces} from 'next/font/google';
const inter = Inter({subsets:['latin'],weight:['400','500','600'],variable:'--font-ui',display:'swap',preload:true});
const fraunces = Fraunces({subsets:['latin'],weight:['600'],variable:'--font-editorial',display:'swap',preload:true});
import {Suspense} from 'react';
import { LensProvider } from '@/components/lens-provider';
import { LensShell } from '@/components/lens-shell';
import {headers} from 'next/headers';
import type {Metadata} from 'next';
export async function generateMetadata():Promise<Metadata>{const h=await headers();const host=h.get('x-forwarded-host')||h.get('host');const protocol=h.get('x-forwarded-proto')==='http'?'http':'https';const metadataBase=host&&/^[a-zA-Z0-9.:-]+$/.test(host)?new URL(`${protocol}://${host}`):undefined;return {metadataBase, manifest:'/manifest.webmanifest', appleWebApp:{capable:true,title:'Nordic Company Lens'}, openGraph:{title:'Nordic Company Lens',description:'Look up Norwegian companies and trace the facts to their source.',type:'website'}, twitter:{card:'summary_large_image',title:'Nordic Company Lens',description:'Every fact, traced to its source.',images:['/opengraph-image']}, title: 'Nordic Company Lens', description: 'Look up Norwegian companies and trace the facts to their source.', icons: { icon: 'https://keystone.jboxai.com/project-assets/ohpazwitpsg6lbbg6r4u7w0q/bd19i6l7vvaujtqcj6vxuvx3/64aa2ebdcd8543e0f840701a7da3f5a989e30feb0d42661e57328395247d17a3/64aa2ebdcd8543e0.svg' } };} 

const initialCompanies=expandIndex(bootstrap.index as CompactIndex).sort((a,b)=>(bootstrap.metadata.evidenceCounts as Record<string,number>)[b.org_number]-(bootstrap.metadata.evidenceCounts as Record<string,number>)[a.org_number]||String(a.legal_name).localeCompare(String(b.legal_name),'nb')).slice(0,12);
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <head><script dangerouslySetInnerHTML={{__html:`(function(){var t='light';try{var s=localStorage.getItem('ncl-theme');if(s==='light'||s==='dark')t=s;}catch(e){}var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';})();`}}/><meta name="color-scheme" content="light dark"/></head>
      <body>
        <Suspense fallback={<><header className="site-header"><div className="container header-inner"><a href="/" className="brand">Nordic Company Lens</a><nav className="nav-links"><a href="/compare">Compare</a></nav></div></header><main aria-label="Loading" aria-busy="true"><div className="container skeleton-state"><label className="search-field home-search"><span className="sr-only">Search companies</span><input placeholder="Search by name, org. number, town or industry" aria-label="Search companies" readOnly/></label><div role="status"><span className="sr-only">Loading company records</span><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div></div></main></>}><LensProvider initialCompanies={initialCompanies} metadata={bootstrap.metadata}><LensShell>{children}<SurfaceDepth/></LensShell></LensProvider></Suspense>
      </body>
    </html>
  )
}
