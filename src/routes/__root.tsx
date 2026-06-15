import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { WaitlistGate } from "@/components/waitlist-gate";
import { AuthProvider } from "@/lib/auth-context";
import { DevRoleSwitcher } from "@/components/dev-role-switcher";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IGE — Event Sponsorship Marketplace | Find Sponsors, Sponsor B2B Events" },
      { name: "description", content: "Inside Global Events (IGE) is the vetted event sponsorship marketplace connecting B2B event organisers, corporate sponsors, and referral partners across the Africa–Europe corridor and globally." },
      { name: "author", content: "Inside Global Events" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "Inside Global Events" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6410c0bf-c8c9-4d1e-b048-e98ce84ec6a2/id-preview-04099da8--0d1f4683-f826-450c-927b-386eaca7e044.lovable.app-1779749582346.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6410c0bf-c8c9-4d1e-b048-e98ce84ec6a2/id-preview-04099da8--0d1f4683-f826-450c-927b-386eaca7e044.lovable.app-1779749582346.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        src: "https://plausible.io/js/script.js",
        defer: true,
        "data-domain": "insideglobalevents.com",
      } as any,
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Inside Global Events",
          alternateName: "IGE",
          url: "https://www.insideglobalevents.com",
          logo: "https://www.insideglobalevents.com/ige-icon-512.png",
          description: "Vetted event sponsorship marketplace connecting B2B event organisers, corporate sponsors, and referral partners.",
          sameAs: ["https://www.instagram.com/insideglobalevents"],
        }),
      } as any,
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Inside Global Events",
          url: "https://www.insideglobalevents.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.insideglobalevents.com/marketplace?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      } as any,
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WaitlistGate>
          <Outlet />
        </WaitlistGate>
        <DevRoleSwitcher />
      </AuthProvider>
    </QueryClientProvider>
  );
}
