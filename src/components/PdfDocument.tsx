import React from "react";
import { Document, Page, Text, StyleSheet, View, Image, Font, Link } from "@react-pdf/renderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { UserRole } from "@/types/chat.types";

type ReactPdfStyle = NonNullable<Parameters<typeof StyleSheet.create>[0]>[string];

// Register Emoji Source for color emojis (Twemoji)
Font.registerEmojiSource({
  format: "png",
  url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/",
});

// ===== KID STYLE SHEET =====
const kidStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 12,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.15,
  },
  header: {
    fontSize: 26,
    marginBottom: 25,
    color: "#0284c7",
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 25,
    borderRadius: 12,
  },
  h1: {
    fontSize: 22,
    marginBottom: 15,
    marginTop: 25,
    fontWeight: "bold",
    color: "#0c4a6e",
  },
  h2: {
    fontSize: 18,
    marginBottom: 12,
    marginTop: 20,
    fontWeight: "bold",
    color: "#075985",
  },
  h3: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 15,
    fontWeight: "bold",
    color: "#0369a1",
  },
  paragraph: {
    marginBottom: 15,
  },
  text: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 1.7,
  },
  bold: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  italic: {
    fontStyle: "italic",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingLeft: 5,
  },
  bullet: {
    width: 25,
    fontSize: 14,
    color: "#0ea5e9",
    fontWeight: "bold",
  },
  bulletText: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 1.7,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 10,
    color: "#94a3b8",
  },
});

// ===== PARENT STYLE SHEET (Clean & Minimalist) =====
const parentStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    lineHeight: 1.6,
    fontFamily: "Helvetica",
    backgroundColor: "#fafafa",
  },
  backgroundContainer: {
    display: "none",
  },
  backgroundImage: {
    display: "none",
  },
  header: {
    fontSize: 22,
    marginBottom: 20,
    color: "#1e293b",
    fontWeight: "bold",
    textAlign: "left",
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 8,
  },
  section: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
    padding: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  h1: {
    fontSize: 18,
    marginBottom: 12,
    marginTop: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  h2: {
    fontSize: 15,
    marginBottom: 10,
    marginTop: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  h3: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: "bold",
    color: "#334155",
  },
  paragraph: {
    marginBottom: 12,
  },
  text: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 1.6,
  },
  bold: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  italic: {
    fontStyle: "italic",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 5,
  },
  bullet: {
    width: 20,
    fontSize: 12,
    color: "#64748b",
  },
  bulletText: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 9,
    color: "#64748b",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

// ===== TEACHER STYLE SHEET (Structured Worksheet) =====
const teacherStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11.5,
    lineHeight: 1.5,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  backgroundContainer: {
    display: "none",
  },
  backgroundImage: {
    display: "none",
  },
  header: {
    fontSize: 24,
    marginBottom: 25,
    color: "#1e3a8a",
    fontWeight: "bold",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#1e3a8a",
    padding: 10,
    backgroundColor: "#eff6ff",
  },
  section: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
    padding: 25,
    borderWidth: 1.5,
    borderColor: "#1e3a8a",
  },
  h1: {
    fontSize: 20,
    marginBottom: 12,
    marginTop: 20,
    fontWeight: "bold",
    color: "#1e3a8a",
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 4,
  },
  h2: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 16,
    fontWeight: "bold",
    color: "#2563eb",
  },
  h3: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  paragraph: {
    marginBottom: 12,
  },
  text: {
    fontSize: 11.5,
    color: "#0f172a",
    lineHeight: 1.6,
  },
  bold: {
    fontWeight: "bold",
    color: "#000000",
  },
  italic: {
    fontStyle: "italic",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 5,
  },
  bullet: {
    width: 22,
    fontSize: 13,
    color: "#1e3a8a",
    fontWeight: "bold",
  },
  bulletText: {
    fontSize: 11.5,
    color: "#0f172a",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 9.5,
    color: "#475569",
    borderTopWidth: 1.5,
    borderTopColor: "#1e3a8a",
    paddingTop: 10,
  },
});

// Clean and prepare markdown content
const cleanMarkdown = (content: string) => {
  if (!content) return "";
  return content
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

type PdfStyles = typeof kidStyles;

interface MarkdownToPdfProps {
  content: string;
  styles: PdfStyles;
}

/**
 * Safely processes children array for react-pdf.
 * It guarantees that:
 * 1. Raw text strings and inline components are wrapped in a single <Text> node.
 * 2. Block-level components (represented as <View> in react-pdf) are rendered outside of <Text> nodes.
 * This completely prevents the crash-prone "View inside Text" nested hierarchy in @react-pdf/renderer.
 */
const renderSafeContent = (
  children: React.ReactNode,
  textStyle: ReactPdfStyle | ReactPdfStyle[] | undefined
) => {
  if (!children) return null;

  const childrenArray = React.Children.toArray(children);
  const elements: React.ReactNode[] = [];
  let inlineBuffer: React.ReactNode[] = [];

  const flushBuffer = (key: string | number) => {
    if (inlineBuffer.length > 0) {
      elements.push(
        <Text key={`inline-${key}`} style={textStyle}>
          {...inlineBuffer}
        </Text>
      );
      inlineBuffer = [];
    }
  };

  childrenArray.forEach((child, idx) => {
    if (typeof child === "string" || typeof child === "number") {
      inlineBuffer.push(child);
    } else if (React.isValidElement(child)) {
      const typeStr =
        typeof child.type === "string"
          ? child.type
          : (child.type as { displayName?: string; name?: string }).displayName ||
            (child.type as { displayName?: string; name?: string }).name ||
            "";

      const isBlock = [
        "View",
        "Document",
        "Page",
        "Image",
        "p",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "div",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
      ].includes(typeStr);

      if (isBlock) {
        flushBuffer(idx);
        elements.push(child);
      } else {
        inlineBuffer.push(child);
      }
    } else {
      inlineBuffer.push(child);
    }
  });

  flushBuffer("final");
  return elements;
};

const MarkdownToPdf = ({ content, styles }: MarkdownToPdfProps) => {
  const cleanedContent = cleanMarkdown(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <Text style={styles.h1}>{children}</Text>,
        h2: ({ children }) => <Text style={styles.h2}>{children}</Text>,
        h3: ({ children }) => <Text style={styles.h3}>{children}</Text>,
        h4: ({ children }) => <Text style={styles.h3}>{children}</Text>,
        h5: ({ children }) => <Text style={styles.h3}>{children}</Text>,
        h6: ({ children }) => <Text style={styles.h3}>{children}</Text>,
        p: ({ children }) => (
          <View style={styles.paragraph}>{renderSafeContent(children, styles.text)}</View>
        ),
        strong: ({ children }) => <Text style={styles.bold}>{children}</Text>,
        em: ({ children }) => <Text style={styles.italic}>{children}</Text>,
        div: ({ children }) => <View>{children}</View>,
        ul: ({ children }) => <View style={{ marginBottom: 8, paddingLeft: 5 }}>{children}</View>,
        ol: ({ children }) => <View style={{ marginBottom: 8, paddingLeft: 5 }}>{children}</View>,
        li: ({
          children,
          index,
          ordered,
        }: {
          children?: React.ReactNode;
          index?: number;
          ordered?: boolean;
        }) => (
          <View style={styles.bulletRow} wrap={false}>
            <Text style={styles.bullet}>
              {ordered ? `${index !== undefined ? index + 1 : 1}.` : "•"}
            </Text>
            <View style={{ flex: 1 }}>{renderSafeContent(children, styles.bulletText)}</View>
          </View>
        ),
        pre: ({ children }) => (
          <View
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#cbd5e1",
              borderRadius: 6,
              padding: 10,
              marginVertical: 10,
            }}
            wrap={false}
          >
            {children}
          </View>
        ),
        code: ({ children }) => {
          const codeString = String(children).replace(/\n$/, "");
          const isInline = !codeString.includes("\n");

          if (isInline) {
            return (
              <Text
                style={{
                  fontFamily: "Courier",
                  backgroundColor: "#f1f5f9",
                  color: "#0f172a",
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                  fontSize: 10,
                  borderRadius: 3,
                }}
              >
                {codeString}
              </Text>
            );
          }

          return (
            <Text
              style={{
                fontFamily: "Courier",
                fontSize: 9.5,
                color: "#334155",
                lineHeight: 1.4,
              }}
            >
              {codeString}
            </Text>
          );
        },
        blockquote: ({ children }) => (
          <View
            style={{
              borderLeftWidth: 3,
              borderLeftColor: "#cbd5e1",
              paddingLeft: 12,
              marginVertical: 10,
            }}
          >
            {renderSafeContent(children, [styles.text, styles.italic, { color: "#475569" }])}
          </View>
        ),
        a: ({ href, children }) => (
          <Link src={href} style={{ color: "#0284c7", textDecoration: "underline" }}>
            {children}
          </Link>
        ),
        hr: () => (
          <View
            style={{
              marginVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#cbd5e1",
            }}
          />
        ),
        br: () => <Text>{"\n"}</Text>,
        del: ({ children }) => <Text style={{ textDecoration: "line-through" }}>{children}</Text>,
        s: ({ children }) => <Text style={{ textDecoration: "line-through" }}>{children}</Text>,
        table: ({ children }) => (
          <View
            style={{ marginVertical: 12, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 4 }}
          >
            {children}
          </View>
        ),
        thead: ({ children }) => (
          <View
            style={{
              backgroundColor: "#f1f5f9",
              borderBottomWidth: 1,
              borderBottomColor: "#cbd5e1",
            }}
          >
            {children}
          </View>
        ),
        tbody: ({ children }) => <View>{children}</View>,
        tr: ({ children }) => (
          <View
            style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" }}
          >
            {children}
          </View>
        ),
        th: ({ children }) => (
          <View style={{ flex: 1, padding: 6 }}>
            <Text style={{ fontWeight: "bold", fontSize: 10, color: "#1e293b" }}>{children}</Text>
          </View>
        ),
        td: ({ children }) => (
          <View style={{ flex: 1, padding: 6 }}>
            <Text style={{ fontSize: 9.5, color: "#334155" }}>{children}</Text>
          </View>
        ),
      }}
    >
      {cleanedContent}
    </ReactMarkdown>
  );
};

type PdfDocumentProps = {
  content: string;
  role?: UserRole;
};

export const PdfDocument = ({ content, role = "kid" }: PdfDocumentProps) => {
  // Select active stylesheet based on user's role
  const getStyles = () => {
    switch (role) {
      case "parent":
        return parentStyles;
      case "teacher":
        return teacherStyles;
      case "kid":
      default:
        return kidStyles;
    }
  };

  const styles = getStyles();

  // Select header title based on user's role
  const getHeaderTitle = () => {
    switch (role) {
      case "parent":
        return "📋 Educational Summary";
      case "teacher":
        return "📖 Educational Worksheet";
      case "kid":
      default:
        return "✨ Learning Adventure ✨";
    }
  };

  // Randomly select a doodle background (1-3) - Only for kid role
  const getDoodleIndex = () => {
    if (!content) return 1;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 2) - hash + content.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 3) + 1;
  };

  const doodleIndex = getDoodleIndex();
  const backgroundSrc = `/doodle${doodleIndex}.png`;

  return (
    <Document title="Learning Material" author="ChatGPT Kids">
      <Page size="A4" style={styles.page}>
        {/* Background Doodles - Only for Kid Theme */}
        {role === "kid" && (
          <View style={styles.backgroundContainer} fixed>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={backgroundSrc} style={styles.backgroundImage} />
          </View>
        )}

        {/* Header Section */}
        <View fixed>
          <Text style={styles.header}>{getHeaderTitle()}</Text>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <MarkdownToPdf content={content} styles={styles as typeof kidStyles} />
        </View>

        {/* Footer Section */}
        <View style={styles.footer} fixed>
          <Text>
            {role === "kid"
              ? "Created with love by ChatGPT Kids 🚀 | Page "
              : role === "teacher"
                ? "ChatGPT Teacher Resource Hub | Page "
                : "ChatGPT Parent Portal Summary | Page "}
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
          </Text>
        </View>
      </Page>
    </Document>
  );
};
