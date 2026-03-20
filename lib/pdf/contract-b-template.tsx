import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import "./fonts";
import { FONT_FAMILY } from "./fonts";
import {
  PLATFORM_ENTITY,
  CONTRACT_B_TITLE,
  CONTRACT_B_NUMBER_PREFIX,
  CONTRACT_B_PREAMBLE,
  CONTRACT_B_CLAUSES,
} from "./legal-clauses-pl";
import type { ContractData } from "./types";

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    padding: 50,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: "#555",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 9,
    marginBottom: 8,
    textAlign: "justify",
  },
  partyBlock: {
    marginBottom: 10,
    paddingLeft: 10,
  },
  partyLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: "#333",
  },
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
    padding: 6,
  },
  colIdx: { width: "8%", fontSize: 9 },
  colTitle: { width: "35%", fontSize: 9 },
  colCriteria: { width: "32%", fontSize: 9 },
  colAmount: { width: "25%", fontSize: 9, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#333",
    padding: 6,
    marginTop: 2,
  },
  totalLabel: { width: "75%", fontSize: 10, fontWeight: "bold", textAlign: "right", paddingRight: 8 },
  totalAmount: { width: "25%", fontSize: 10, fontWeight: "bold", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
  signatureBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderColor: "#333",
    marginTop: 40,
    paddingTop: 4,
    fontSize: 9,
    color: "#555",
  },
});

export function ContractBDocument({ data }: { data: ContractData }) {
  const contractNumber = `${CONTRACT_B_NUMBER_PREFIX}/${new Date().getFullYear()}/${data.contractId.slice(0, 8).toUpperCase()}`;

  // Student sees net amounts (after platform fee)
  const feeMultiplier = 1 - data.platformFeePercent / 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{CONTRACT_B_TITLE}</Text>
          <Text style={styles.subtitle}>Nr {contractNumber}</Text>
          <Text style={styles.subtitle}>z dnia {data.createdAt}</Text>
        </View>

        {/* Preamble */}
        <Text style={styles.paragraph}>{CONTRACT_B_PREAMBLE}</Text>

        {/* Party 1: Platform (Zamawiający) */}
        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>ZAMAWIAJĄCY (Platforma):</Text>
          <Text style={styles.partyDetail}>{PLATFORM_ENTITY.name}</Text>
          <Text style={styles.partyDetail}>
            {PLATFORM_ENTITY.address}, {PLATFORM_ENTITY.city}
          </Text>
          <Text style={styles.partyDetail}>NIP: {PLATFORM_ENTITY.nip}</Text>
          <Text style={styles.partyDetail}>
            Reprezentowana przez: {PLATFORM_ENTITY.representedBy}
          </Text>
        </View>

        {/* Party 2: Student (Wykonawca) */}
        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>WYKONAWCA (Student):</Text>
          <Text style={styles.partyDetail}>{data.studentName}</Text>
          <Text style={styles.partyDetail}>Email: {data.studentEmail}</Text>
        </View>

        {/* Clauses */}
        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.subject}</Text>

        {/* Offer description */}
        <Text style={styles.sectionTitle}>Opis dzieła:</Text>
        <Text style={styles.paragraph}>
          Tytuł: {data.offerTitle}
        </Text>
        {data.offerDescription && (
          <Text style={styles.paragraph}>{data.offerDescription}</Text>
        )}

        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.scope}</Text>
      </Page>

      {/* Page 2: Schedule + payment + IP */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>HARMONOGRAM REALIZACJI I WYNAGRODZENIA:</Text>

        {/* Milestone table — NET amounts for student */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colIdx, { fontWeight: "bold" }]}>Lp.</Text>
            <Text style={[styles.colTitle, { fontWeight: "bold" }]}>Etap</Text>
            <Text style={[styles.colCriteria, { fontWeight: "bold" }]}>Kryteria akceptacji</Text>
            <Text style={[styles.colAmount, { fontWeight: "bold" }]}>
              Wynagrodzenie netto (PLN)
            </Text>
          </View>
          {data.milestones.map((m) => (
            <View key={m.idx} style={styles.tableRow}>
              <Text style={styles.colIdx}>{m.idx}</Text>
              <Text style={styles.colTitle}>{m.title}</Text>
              <Text style={styles.colCriteria}>{m.criteria || "—"}</Text>
              <Text style={styles.colAmount}>
                {(Number(m.amount) * feeMultiplier).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SUMA WYNAGRODZENIA NETTO:</Text>
            <Text style={styles.totalAmount}>
              {data.netAmount.toFixed(2)} {data.currency}
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          Kwota brutto zlecenia: {data.totalAmount.toFixed(2)} {data.currency}.{"\n"}
          Prowizja platformy ({data.platformFeePercent}%): {data.platformFee.toFixed(2)} {data.currency}.{"\n"}
          Wynagrodzenie netto Wykonawcy: {data.netAmount.toFixed(2)} {data.currency}.
        </Text>

        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.payment}</Text>
        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.ip}</Text>
      </Page>

      {/* Page 3: Remaining clauses + signatures */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.confidentiality}</Text>
        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.quality}</Text>
        <Text style={styles.paragraph}>{CONTRACT_B_CLAUSES.final}</Text>

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>ZAMAWIAJĄCY (Platforma)</Text>
            <Text style={{ fontSize: 8, color: "#888", marginTop: 4 }}>
              {PLATFORM_ENTITY.name}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>WYKONAWCA (Student)</Text>
            <Text style={{ fontSize: 8, color: "#888", marginTop: 4 }}>
              {data.studentName}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Wygenerowano automatycznie przez platformę Student Impact | {contractNumber} | {data.createdAt}
        </Text>
      </Page>
    </Document>
  );
}
