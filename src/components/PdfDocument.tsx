import React from "react";
import { Document, Page, Text, StyleSheet, View, Font, type TextProps } from "@react-pdf/renderer";

// Register Fonts - Using local files for reliability
Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "/fonts/NotoSans-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "/fonts/NotoSans-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

// Register Emoji Font - Using local file
Font.register({
  family: "NotoEmoji",
  src: "/fonts/NotoEmoji-Regular.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 12,
    lineHeight: 1.5,
    fontFamily: "NotoSans",
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 26,
    marginBottom: 25,
    color: "#0284c7",
    fontWeight: "bold",
    textAlign: "center",
    borderBottom: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  h1: {
    fontSize: 22,
    marginBottom: 12,
    marginTop: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  h2: {
    fontSize: 18,
    marginBottom: 10,
    marginTop: 15,
    fontWeight: "bold",
    color: "#1e293b",
  },
  text: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 10,
  },
  bold: {
    fontWeight: "bold",
    color: "#000000",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 15,
  },
  bullet: {
    width: 20,
    fontSize: 14,
    color: "#0284c7",
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: "#334155",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 10,
    color: "#94a3b8",
    borderTop: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 15,
  },
});

// Enhanced Emoji Regex
const emojiRegex =
  /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

const renderTextContent = (text: string, baseStyle: TextProps["style"] = {}) => {
  if (!text) return null;

  // Split by bold patterns **text**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={baseStyle}>
      {boldParts.map((part, i) => {
        const isBold = part.startsWith("**") && part.endsWith("**");
        const content = isBold ? part.slice(2, -2) : part;

        const baseStyleArray = Array.isArray(baseStyle) ? baseStyle : baseStyle ? [baseStyle] : [];
        const partStyle: TextProps["style"] = isBold
          ? [...baseStyleArray, { fontWeight: "bold" }]
          : baseStyle;

        // Inside each part, handle emojis
        const emojiParts = content.split(emojiRegex);
        return (
          <Text key={`part-${i}`} style={partStyle}>
            {emojiParts.map((emojiPart, j) => {
              if (emojiPart.match(emojiRegex)) {
                return (
                  <Text key={`${i}-${j}`} style={{ fontFamily: "NotoEmoji" }}>
                    {emojiPart}
                  </Text>
                );
              }
              return emojiPart;
            })}
          </Text>
        );
      })}
    </Text>
  );
};

const SimpleMarkdown = ({ content }: { content: string }) => {
  // Basic cleaning
  const cleanContent = content.replace(/\r/g, "").trim();
  const lines = cleanContent.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Headers
    if (trimmedLine.startsWith("# ")) {
      elements.push(
        <View key={index} style={styles.section}>
          {renderTextContent(trimmedLine.replace("# ", ""), styles.h1)}
        </View>
      );
    } else if (trimmedLine.startsWith("## ")) {
      elements.push(
        <View key={index} style={styles.section}>
          {renderTextContent(trimmedLine.replace("## ", ""), styles.h2)}
        </View>
      );
    } else if (trimmedLine.startsWith("### ")) {
      elements.push(
        <View key={index} style={styles.section}>
          {renderTextContent(trimmedLine.replace("### ", ""), styles.h2)}
        </View>
      );
    }
    // Bullets
    else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      const bulletText = trimmedLine.substring(2);
      elements.push(
        <View key={index} style={styles.bulletRow}>
          <Text style={{ fontFamily: "NotoEmoji", width: 15, color: "#0284c7" }}>•</Text>
          <View style={{ flex: 1 }}>{renderTextContent(bulletText, styles.bulletText)}</View>
        </View>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <View key={index} style={styles.section}>
          {renderTextContent(trimmedLine, styles.text)}
        </View>
      );
    }
  });

  return <>{elements}</>;
};

export const PdfDocument = ({ content }: { content: string }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Learning Adventure 🚀</Text>
        </View>

        <SimpleMarkdown content={content} />

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} • Created with Love by ChatGPT Kids`
          }
        />
      </Page>
    </Document>
  );
};
