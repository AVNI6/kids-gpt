import React from "react";
import { Document, Page, Text, StyleSheet, View, Image, Font } from "@react-pdf/renderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Register Emoji Source for color emojis (Twemoji)
Font.registerEmojiSource({
  format: "png",
  url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
});

const styles = StyleSheet.create({
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
    marginBottom: 18,
    paddingLeft: 5,
    minHeight: 20,
  },
  bullet: {
    width: 25,
    fontSize: 14,
    color: "#0ea5e9",
    fontWeight: "bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 1.7,
    marginTop: 7,
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

// Clean and prepare markdown content
const cleanMarkdown = (content: string) => {
  if (!content) return "";
  return content
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const MarkdownToPdf = ({ content }: { content: string }) => {
  const cleanedContent = cleanMarkdown(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Standard block elements use View to avoid "orphan string" issues
        h1: ({ children }) => (
          <View>
            <Text style={styles.h1}>{children}</Text>
          </View>
        ),
        h2: ({ children }) => (
          <View>
            <Text style={styles.h2}>{children}</Text>
          </View>
        ),
        h3: ({ children }) => (
          <View>
            <Text style={styles.h3}>{children}</Text>
          </View>
        ),
        p: ({ children }) => (
          <View style={styles.paragraph}>
            <Text style={styles.text}>{children}</Text>
          </View>
        ),

        strong: ({ children }) => <Text style={styles.bold}>{children}</Text>,
        em: ({ children }) => <Text style={styles.italic}>{children}</Text>,

        ul: ({ children }) => <View style={{ marginBottom: 10 }}>{children}</View>,
        ol: ({ children }) => <View style={{ marginBottom: 10 }}>{children}</View>,

        li: ({ children }) => (
          <View style={styles.bulletRow} wrap={false}>
            <Text style={styles.bullet}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>{children}</Text>
            </View>
          </View>
        ),

        code: ({ children }) => (
          <Text style={{ backgroundColor: "#f1f5f9", padding: 2 }}>{children}</Text>
        ),

        blockquote: ({ children }) => (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: "#bae6fd",
              paddingLeft: 12,
              marginBottom: 15,
            }}
          >
            <Text style={[styles.text, styles.italic, { color: "#475569" }]}>{children}</Text>
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
};

export const PdfDocument = ({ content }: PdfDocumentProps) => {
  // Randomly select a doodle background (1-5)
  // We use a simple hash of the content to keep the background consistent for the same content
  const getDoodleIndex = () => {
    if (!content) return 1;
    // Simple hash of content to pick a number between 1 and 5
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 2) - hash + content.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 5) + 1;
  };

  const doodleIndex = getDoodleIndex();
  const backgroundSrc = `/doodle${doodleIndex}.png`;

  return (
    <Document title="Learning Material" author="ChatGPT Kids">
      <Page size="A4" style={styles.page}>
        {/* Background Doodles */}
        <View style={styles.backgroundContainer} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={backgroundSrc} style={styles.backgroundImage} />
        </View>

        {/* Header Section */}
        <View fixed>
          <Text style={styles.header}>✨ Learning Adventure ✨</Text>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <MarkdownToPdf content={content} />
        </View>

        {/* Footer Section */}
        <View style={styles.footer} fixed>
          <Text>
            Created with love by ChatGPT Kids 🚀 | Page{" "}
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
          </Text>
        </View>
      </Page>
    </Document>
  );
};
