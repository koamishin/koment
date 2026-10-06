"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@saasfly/ui/dialog";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Badge } from "@saasfly/ui/badge";
import { toast } from "@saasfly/ui/use-toast";
import * as Icons from "@saasfly/ui/icons";

interface ShareTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: {
    id: number;
    name: string;
    slug: string;
    game: string;
    gameFormat?: string;
    maxTeams: number;
    prizePool?: string | null;
    startsAt: Date | string;
    organizationName?: string;
  };
  lang?: string;
}

export function ShareTournamentDialog({
  open,
  onOpenChange,
  tournament,
  lang = "en",
}: ShareTournamentDialogProps) {
  const [copiedRegister, setCopiedRegister] = React.useState(false);
  const [copiedBracket, setCopiedBracket] = React.useState(false);
  const [qrSvg, setQrSvg] = React.useState<string>("");
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const registerUrl = `${origin}/${lang}/tournaments/${tournament.slug}/register`;
  const bracketUrl = `${origin}/${lang}/tournaments/${tournament.slug}`;

  React.useEffect(() => {
    if (open && registerUrl) {
      void QRCode.toString(registerUrl, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000ff", light: "#ffffffff" },
      }).then(setQrSvg);

      void QRCode.toDataURL(registerUrl, {
        margin: 2,
        width: 600,
        errorCorrectionLevel: "H",
        color: { dark: "#000000ff", light: "#ffffffff" },
      }).then(setQrDataUrl);
    }
  }, [open, registerUrl]);

  const handleCopyRegister = () => {
    void navigator.clipboard.writeText(registerUrl);
    setCopiedRegister(true);
    toast({
      title: "Registration Link Copied!",
      description: "Students will open directly to the team registration form.",
    });
    setTimeout(() => setCopiedRegister(false), 2500);
  };

  const handleCopyBracket = () => {
    void navigator.clipboard.writeText(bracketUrl);
    setCopiedBracket(true);
    toast({
      title: "Bracket Link Copied!",
      description: "Link for spectators and fans to view live bracket matches.",
    });
    setTimeout(() => setCopiedBracket(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${tournament.slug}-registration-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: "Registration QR Code Downloaded",
      description: "Ready to print on school flyers, Discord announcements, or club posters.",
    });
  };

  const handlePrintFlyer = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tournament.name} - Student Registration Flyer</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding: 40px 20px;
              color: #111;
            }
            .card {
              max-width: 520px;
              margin: 0 auto;
              border: 3px solid #111;
              border-radius: 24px;
              padding: 40px 30px;
            }
            h1 { font-size: 28px; margin: 8px 0; font-weight: 900; }
            .badge {
              display: inline-block;
              background: #6366f1;
              color: white;
              padding: 6px 16px;
              border-radius: 999px;
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 12px;
            }
            .subtitle {
              font-size: 14px;
              color: #4b5563;
              margin-bottom: 20px;
            }
            .qr-box {
              margin: 20px auto;
              width: 260px;
              height: 260px;
              padding: 12px;
              background: #fff;
              border: 2px dashed #6366f1;
              border-radius: 20px;
            }
            .qr-box img { width: 100%; height: 100%; }
            .instructions {
              font-size: 16px;
              font-weight: 800;
              color: #111;
              margin-top: 20px;
            }
            .steps {
              font-size: 13px;
              color: #555;
              line-height: 1.6;
              margin: 12px auto;
              max-width: 380px;
              text-align: left;
            }
            .url {
              font-family: monospace;
              background: #f1f5f9;
              padding: 8px 12px;
              border-radius: 8px;
              word-break: break-all;
              font-size: 12px;
              margin-top: 15px;
            }
            .footer { margin-top: 25px; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">${tournament.game} • ${tournament.gameFormat ?? "5v5"}</div>
            <h1>${tournament.name}</h1>
            <p class="subtitle">Campus & Student Tournament • Self-Registration Open</p>
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="Scan to Register" />
            </div>
            <p class="instructions">📱 SCAN TO REGISTER YOUR TEAM</p>
            <div class="steps">
              1. Point your phone camera at the QR code<br/>
              2. Enter team name & captain contact tag<br/>
              3. Claim your spot in the bracket instantly!
            </div>
            <div class="url">${registerUrl}</div>
            <p class="footer">Powered by Koment • Automated Live Brackets</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icons.QrCode className="h-4 w-4" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
              Student Self-Registration
            </span>
          </div>
          <DialogTitle className="text-xl font-black">
            Share Tournament & Registration QR
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send this link or print the QR code. Students will land straight on the registration form to enter their team and roster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Primary: Student Self-Registration Link */}
          <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Icons.Ticket className="h-4 w-4 text-primary" />
                Direct Student Registration Link
              </span>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                Opens Form Directly
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Send this to team captains on Discord, WhatsApp, Instagram, or school forums.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Input
                readOnly
                value={registerUrl}
                className="font-mono text-xs select-all bg-background"
              />
              <Button
                type="button"
                onClick={handleCopyRegister}
                className="gap-1.5 shrink-0 font-bold bg-primary hover:bg-primary/90 text-xs"
              >
                {copiedRegister ? (
                  <>
                    <Icons.Check className="h-4 w-4 text-emerald-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icons.Copy className="h-4 w-4" />
                    Copy Register Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Scannable Printable QR Poster Section */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 via-card/40 to-background p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-md border border-neutral-200 shrink-0">
                {qrSvg ? (
                  <div
                    className="w-40 h-40"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground">
                    <Icons.Spinner className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <span className="text-[10px] font-mono font-bold text-neutral-600 mt-1 uppercase">
                  Scans to /register
                </span>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {tournament.game}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {tournament.gameFormat ?? "5v5"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Max {tournament.maxTeams} Teams
                  </span>
                </div>

                <h4 className="font-bold text-base text-foreground leading-snug">
                  {tournament.name}
                </h4>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Students scan this QR code with their phone camera to instantly open the team signup form. Print out as a flyer or project on a screen!
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadQr}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Icons.Download className="h-3.5 w-3.5" />
                    Download PNG
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePrintFlyer}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Icons.Post className="h-3.5 w-3.5" />
                    Print Flyer Poster
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary: Spectator & Live Bracket Link */}
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Icons.Swords className="h-3.5 w-3.5 text-muted-foreground" />
                Live Bracket & Spectator Link (Optional)
              </span>
              <span className="text-[10px] text-muted-foreground">
                For stream chats, parents & fans
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={bracketUrl}
                className="font-mono text-xs select-all bg-background h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyBracket}
                className="gap-1.5 shrink-0 text-xs h-8 font-semibold"
              >
                {copiedBracket ? (
                  <>
                    <Icons.Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Icons.Copy className="h-3.5 w-3.5" />
                    Copy Bracket Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
