import React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { workspaceName?: string; productName?: string; inviterName?: string; link?: string }

const Email = ({ workspaceName, productName = "Tandem", inviterName, link = "https://tandem.civicplexus.org/auth" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`You're invited to join ${workspaceName ?? "a workspace"} on ${productName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{productName}</Text>
        <Heading style={h1}>You're invited to {workspaceName ?? "a workspace"}</Heading>
        <Text style={text}>
          {inviterName ? `${inviterName} invited you` : "You've been invited"} to join {workspaceName ?? "their workspace"} on {productName} — a simple, private space for 1-on-1s that help people grow.
        </Text>
        <Text style={text}>Create your account with this email address and you'll join automatically.</Text>
        <Button href={link} style={button}>Accept invitation</Button>
        <Text style={muted}>If you weren't expecting this, you can ignore this email.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `You're invited to ${d["workspaceName"] ?? "a workspace"} on ${d["productName"] ?? "Tandem"}`,
  displayName: "Workspace invitation",
  previewData: { workspaceName: "Northwind Team", productName: "Tandem", inviterName: "Jordan Lee", link: "https://tandem.civicplexus.org/auth?email=priya%40example.org" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const brand = { fontFamily: "Montserrat, Arial, sans-serif", fontWeight: 700, color: "#0f766e", fontSize: "18px", margin: "0 0 24px" };
const h1 = { fontFamily: "Montserrat, Arial, sans-serif", fontSize: "24px", fontWeight: 700, color: "#0b2f3a", margin: "0 0 16px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#334155", margin: "0 0 16px" };
const button = { backgroundColor: "#0b3b4a", color: "#ffffff", borderRadius: "8px", padding: "12px 22px", fontSize: "15px", fontWeight: 600, textDecoration: "none" };
const muted = { fontSize: "13px", color: "#64748b", marginTop: "28px" };
