import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n-context";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl mb-4">🌾</div>
        <h1 className="text-4xl font-display font-bold text-primary">404</h1>
        <h2 className="mt-3 text-xl font-display font-bold text-foreground">पृष्ठ नहीं मिला</h2>
        <p className="mt-2 text-muted-foreground">
          This page doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            🏠 Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Krishi Samadhan — किसान का डिजिटल साथी" },
      {
        name: "description",
        content:
          "Krishi Samadhan helps Indian farmers with AI crop advice, disease detection, and expert consultations — in your language.",
      },
      { name: "author", content: "Krishi Samadhan" },
      { name: "theme-color", content: "#1A5C38" },
      { property: "og:title", content: "Krishi Samadhan — किसान का डिजिटल साथी" },
      {
        property: "og:description",
        content: "AI crop advice, disease detection, and expert help.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi-IN">
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
  return (
    <LanguageProvider>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </LanguageProvider>
  );
}
