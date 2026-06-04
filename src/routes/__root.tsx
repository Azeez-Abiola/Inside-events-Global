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
      { title: "Inside Global Events 2026" },
      { name: "description", content: "Inside Global Events 2026 (IGE) is a vertically integrated event intelligence and sponsorship marketplace for the Africa-Europe corridor and the global events economy." },
      { name: "author", content: "Inside Global Events 2026" },
      { property: "og:title", content: "Inside Global Events 2026" },
      { property: "og:description", content: "Inside Global Events 2026 (IGE) is a vertically integrated event intelligence and sponsorship marketplace for the Africa-Europe corridor and the global events economy." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Inside Global Events 2026" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Inside Global Events 2026" },
      { name: "twitter:description", content: "Inside Global Events 2026 (IGE) is a vertically integrated event intelligence and sponsorship marketplace for the Africa-Europe corridor and the global events economy." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6410c0bf-c8c9-4d1e-b048-e98ce84ec6a2/id-preview-04099da8--0d1f4683-f826-450c-927b-386eaca7e044.lovable.app-1779749582346.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6410c0bf-c8c9-4d1e-b048-e98ce84ec6a2/id-preview-04099da8--0d1f4683-f826-450c-927b-386eaca7e044.lovable.app-1779749582346.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://www.insideglobalevents.com/" },
    ],
    scripts: [
      {
        src: "https://plausible.io/js/script.js",
        defer: true,
        "data-domain": "insideglobalevents.com",
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
      <WaitlistGate>
        <Outlet />
      </WaitlistGate>
    </QueryClientProvider>
  );
}
