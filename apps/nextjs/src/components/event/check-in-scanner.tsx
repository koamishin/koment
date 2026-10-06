"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@saasfly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import { Input } from "@saasfly/ui/input";
import * as Icons from "@saasfly/ui/icons";

import { cn } from "@saasfly/ui";

import type { EventDict } from "~/components/event/dict";
import { StatCard } from "~/components/shell";
import { trpc } from "~/trpc/client";

interface CheckInScannerProps {
  organizationId: number;
  eventId: number;
  canQr: boolean;
  dict: EventDict;
}

interface ScanFeedback {
  tone: "success" | "duplicate" | "error";
  title: string;
  detail?: string;
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options: {
      formats: string[];
    }) => BarcodeDetectorLike;
  }
}

export function CheckInScanner({
  organizationId,
  eventId,
  canQr,
  dict,
}: CheckInScannerProps) {
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const busyRef = React.useRef<boolean>(false);

  const [isScanning, setIsScanning] = React.useState<boolean>(false);
  const [isSupported, setIsSupported] = React.useState<boolean>(false);
  const [manualCode, setManualCode] = React.useState<string>("");
  const [feedback, setFeedback] = React.useState<ScanFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "BarcodeDetector" in window,
    );
  }, []);

  const stopScanning = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  React.useEffect(() => stopScanning, [stopScanning]);

  const submitCode = React.useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code || busyRef.current) {
        return;
      }

      busyRef.current = true;
      setIsSubmitting(true);

      try {
        const result = await trpc.checkIn.verifyCode.mutate({
          organizationId,
          eventId,
          code,
        });

        setFeedback({
          tone: result.alreadyCheckedIn ? "duplicate" : "success",
          title: result.registration.name,
          detail: result.alreadyCheckedIn
            ? dict.check_in_duplicate
            : dict.check_in_success,
        });
        setManualCode("");
        router.refresh();
      } catch (error) {
        setFeedback({
          tone: "error",
          title: error instanceof Error ? error.message : dict.no_code_found,
        });
      } finally {
        busyRef.current = false;
        setIsSubmitting(false);
      }
    },
    [organizationId, eventId, router, dict],
  );

  const startScanning = React.useCallback(async () => {
    const Detector = window.BarcodeDetector;
    if (!Detector) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stopScanning();
        return;
      }

      video.srcObject = stream;
      await video.play();
      setIsScanning(true);
      setFeedback(null);

      const detector = new Detector({ formats: ["qr_code"] });

      const tick = async () => {
        const element = videoRef.current;
        if (!element || element.readyState < 2) {
          frameRef.current = requestAnimationFrame(() => void tick());
          return;
        }

        try {
          const codes = await detector.detect(element);
          const value = codes[0]?.rawValue;
          if (value) {
            stopScanning();
            void submitCode(value);
            return;
          }
        } catch {
          // An unreadable frame is expected while the camera focuses.
        }

        frameRef.current = requestAnimationFrame(() => void tick());
      };

      frameRef.current = requestAnimationFrame(() => void tick());
    } catch {
      setIsSupported(false);
      setFeedback({ tone: "error", title: dict.scanner_unavailable });
      stopScanning();
    }
  }, [dict.scanner_unavailable, stopScanning, submitCode]);

  return (
    <div className="space-y-6">
      {canQr ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dict.check_in}</CardTitle>
            <CardDescription>{dict.check_in_text}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
              />
              {isScanning ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-lg border-2 border-white/80" />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-white/70">
                  <Icons.Camera className="h-8 w-8" />
                  <span>{dict.start_scanner}</span>
                </div>
              )}
            </div>

            {isSupported ? (
              <Button
                variant={isScanning ? "outline" : "default"}
                onClick={() => {
                  if (isScanning) {
                    stopScanning();
                    return;
                  }
                  void startScanning();
                }}
              >
                {isScanning ? (
                  <Icons.Close className="mr-2 h-4 w-4" />
                ) : (
                  <Icons.Scan className="mr-2 h-4 w-4" />
                )}
                {isScanning ? dict.stop_scanner : dict.start_scanner}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {dict.scanner_unavailable}
              </p>
            )}

            {feedback ? <ScanFeedbackCard feedback={feedback} /> : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.manual_code}</CardTitle>
          <CardDescription>{dict.mark_present}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              void submitCode(manualCode);
              return;
            }}
          >
            <Input
              value={manualCode}
              onChange={(changeEvent) => {
                setManualCode(changeEvent.target.value);
                setFeedback(null);
              }}
              placeholder={dict.manual_code_placeholder}
              className="uppercase"
            />
            <Button type="submit" disabled={isSubmitting || !manualCode.trim()}>
              {isSubmitting ? (
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.Check className="mr-2 h-4 w-4" />
              )}
              {dict.mark_present}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface ScanFeedbackCardProps {
  feedback: ScanFeedback;
}

function ScanFeedbackCard({ feedback }: ScanFeedbackCardProps) {
  const toneClass =
    feedback.tone === "success"
      ? "border-green-500/40 bg-green-500/10"
      : feedback.tone === "duplicate"
        ? "border-amber-500/40 bg-amber-500/10"
        : "border-red-500/40 bg-red-500/10";

  return (
    <div className={cn("rounded-md border px-4 py-3", toneClass)}>
      <div className="flex items-center gap-2">
        {feedback.tone === "success" ? (
          <Icons.Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : feedback.tone === "duplicate" ? (
          <Icons.Warning className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <Icons.Rejected className="h-4 w-4 text-destructive" />
        )}
        <span className="font-medium">{feedback.title}</span>
      </div>
      {feedback.detail ? (
        <p className="ml-6 text-sm text-muted-foreground">{feedback.detail}</p>
      ) : null}
    </div>
  );
}

interface LiveStatsProps {
  confirmed: number;
  pending: number;
  present: number;
  capacity: number | null;
  dict: Record<string, string>;
}

export function LiveStats({
  confirmed,
  pending,
  present,
  capacity,
  dict,
}: LiveStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label={dict.registered}
        value={
          capacity !== null ? (
            <>
              {confirmed}
              <span className="text-lg text-muted-foreground">/{capacity}</span>
            </>
          ) : (
            confirmed
          )
        }
        icon={<Icons.Ticket className="h-4 w-4" />}
        tone="accent"
      />
      <StatCard
        label={dict.pending_approval}
        value={pending}
        icon={<Icons.Clock className="h-4 w-4" />}
        tone="warning"
      />
      <StatCard
        label={dict.present}
        value={present}
        icon={<Icons.CheckIn className="h-4 w-4" />}
        tone="success"
      />
    </div>
  );
}
