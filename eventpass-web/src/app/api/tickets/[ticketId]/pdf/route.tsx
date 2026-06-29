import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { getTicketById } from "@/backend/services/tickets";
import QRCode from "qrcode";
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function localImageToDataUri(publicPath: string): Promise<string | null> {
  const ext = path.extname(publicPath).toLowerCase();
  const mime = EXT_MIME[ext];
  if (!mime) return null;
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", publicPath));
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  stub: {
    position: "relative",
    width: 200,
    backgroundColor: "#0a0a10",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  posterBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 200,
    height: 250,
    opacity: 0.22,
  },
  qrWrapper: {
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 8,
  },
  qrImage: {
    width: 140,
    height: 140,
  },
  scanLabel: {
    color: "#ffffff",
    fontSize: 7,
    letterSpacing: 2,
    marginTop: 6,
    opacity: 0.5,
  },
  info: {
    flex: 1,
    padding: 28,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0a0a0f",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#0a0a0f",
    opacity: 0.6,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  cell: {
    width: "45%",
  },
  cellLabel: {
    fontSize: 7,
    color: "#0a0a0f",
    opacity: 0.4,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0a0a0f",
  },
  gateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8efff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: "auto",
  },
  gateText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1452f0",
  },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await getTicketById(ticketId);

  if (!ticket || ticket.order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qrToken, {
    width: 280,
    margin: 2,
    color: { dark: "#0a0a0f", light: "#ffffff" },
  });
  const posterDataUri = await localImageToDataUri(ticket.event.imageUrl);

  const dt = new Date(ticket.event.startsAt);
  const dateStr = dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const shortId = ticket.order.id.slice(-8).toUpperCase();

  const pdfDoc = (
    <Document title={`${ticket.event.title} — EventPass`}>
      <Page size={[595, 250]} style={styles.page}>
        <View style={styles.stub}>
          {posterDataUri && <Image style={styles.posterBg} src={posterDataUri} />}
          <View style={styles.qrWrapper}>
            <Image style={styles.qrImage} src={qrDataUrl} />
          </View>
          <Text style={styles.scanLabel}>SCAN AT THE DOOR</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{ticket.event.title}</Text>
          <Text style={styles.meta}>
            {ticket.event.venueName} · {ticket.event.city}
            {"\n"}
            {dateStr} · {timeStr}
          </Text>

          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Holder</Text>
              <Text style={styles.cellValue}>{ticket.holderName}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Ticket</Text>
              <Text style={styles.cellValue}>{ticket.ticketType.name}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Order</Text>
              <Text style={styles.cellValue}>#{shortId}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Status</Text>
              <Text style={styles.cellValue}>{ticket.status}</Text>
            </View>
          </View>

          <View style={styles.gateBadge}>
            <Text style={styles.gateText}>Gate {ticket.gate}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(pdfDoc);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${shortId}.pdf"`,
    },
  });
}
