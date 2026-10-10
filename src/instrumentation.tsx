import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { isRuntimeError, normalizeRejection } from "@/lib/error-report";

async function reportErrorToVly(errorData: {
  error: string;
  stackTrace?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}) {
  if (!import.meta.env.VITE_VLY_APP_ID || !import.meta.env.VITE_VLY_MONITORING_URL) {
    return;
  }

  try {
    await fetch(import.meta.env.VITE_VLY_MONITORING_URL, {
      method: "POST",
      body: JSON.stringify({
        ...errorData,
        url: window.location.href,
        projectSemanticIdentifier: import.meta.env.VITE_VLY_APP_ID,
      }),
    });
  } catch (error) {
    console.error("Failed to report error to Vly:", error);
  }
}

function ErrorDialog() {
  return (
    <Dialog open>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Something went wrong</DialogTitle>
        </DialogHeader>
        We couldn’t finish loading this page. Reload to try again.
        <DialogFooter>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw /> Reload page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    reportErrorToVly({
      error: error.message,
      stackTrace: error.stack,
    });
    this.setState({
      hasError: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDialog />;
    }

    return this.props.children;
  }
}

export function InstrumentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = async (event: ErrorEvent) => {
      // Resource-loading failures (img/css/script — e.g. a blocked YouTube
      // thumbnail) also surface here, without an Error object. They are not
      // runtime errors and shouldn't pop the dialog.
      if (!isRuntimeError(event)) return;
      try {
        console.log(event);
        event.preventDefault();
        setHasError(true);

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.message,
            stackTrace: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      } catch (error) {
        console.error("Error in handleError:", error);
      }
    };

    const handleRejection = async (event: PromiseRejectionEvent) => {
      try {
        console.error(event);

        const { error: message, stack } = normalizeRejection(event.reason);

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: message,
            stackTrace: stack,
          });
        }

        setHasError(true);
      } catch (error) {
        console.error("Error in handleRejection:", error);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
  return (
    <>
      <ErrorBoundary>{children}</ErrorBoundary>
      {hasError && <ErrorDialog />}
    </>
  );
}
