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
  CONTRACT_A_TITLE,
  CONTRACT_A_NUMBER_PREFIX,
  CONTRACT_A_PREAMBLE,
  CONTRACT_A_CLAUSES,
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
  colTitle: { width: "32%", fontSize: 9 },
  colCriteria: { width: "30%", fontSize: 9 },
  colAmount: { width: "15%", fontSize: 9, textAlign: "right" },
  colDue: { width: "15%", fontSize: 9, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#333",
    padding: 6,
    marginTop: 2,
  },
  totalLabel: { width: "70%", fontSize: 10, fontWeight: "bold", textAlign: "right", paddingRight: 8 },
  totalAmount: { width: "30%", fontSize: 10, fontWeight: "bold", textAlign: "right" },
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

export function ContractADocument({ data }: { data: ContractData }) {
  const contractNumber = `${CONTRACT_A_NUMBER_PREFIX}/${new Date().getFullYear()}/${data.contractId.slice(0, 8).toUpperCase()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{CONTRACT_A_TITLE}</Text>
          <Text style={styles.subtitle}>Nr {contractNumber}</Text>
          <Text style={styles.subtitle}>z dnia {data.createdAt}</Text>
        </View>

        {/* Preamble */}
        <Text style={styles.paragraph}>{CONTRACT_A_PREAMBLE}</Text>

        {/* Party 1: Platform */}
        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>WYKONAWCA (Platforma):</Text>
          <Text style={styles.partyDetail}>{PLATFORM_ENTITY.name}</Text>
          <Text style={styles.partyDetail}>
            {PLATFORM_ENTITY.address}, {PLATFORM_ENTITY.city}
          </Text>
          <Text style={styles.partyDetail}>NIP: {PLATFORM_ENTITY.nip}</Text>
          <Text style={styles.partyDetail}>
            Reprezentowana przez: {PLATFORM_ENTITY.representedBy}
          </Text>
        </View>

        {/* Party 2: Company */}
        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>ZLECENIODAWCA (Firma):</Text>
          <Text style={styles.partyDetail}>{data.companyName}</Text>
          <Text style={styles.partyDetail}>
            {data.companyAddress}, {data.companyCity}
          </Text>
          {data.companyNip && (
            <Text style={styles.partyDetail}>NIP: {data.companyNip}</Text>
          )}
          <Text style={styles.partyDetail}>
            Osoba kontaktowa: {data.companyContactPerson}
          </Text>
        </View>

        {/* Clauses */}
        <Text style={styles.paragraph}>{CONTRACT_A_CLAUSES.subject}</Text>

        {/* Offer description */}
        <Text style={styles.sectionTitle}>Opis zlecenia:</Text>
        <Text style={styles.paragraph}>
          Tytuł: {data.offerTitle}
        </Text>
        {data.offerDescription && (
          <Text style={styles.paragraph}>{data.offerDescription}</Text>
        )}

        <Text style={styles.paragraph}>{CONTRACT_A_CLAUSES.scope}</Text>
      </Page>

      {/* Page 2: Schedule + remaining clauses */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>HARMONOGRAM REALIZACJI I PŁATNOŚCI:</Text>

        {/* Milestone table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colIdx, { fontWeight: "bold" }]}>Lp.</Text>
            <Text style={[styles.colTitle, { fontWeight: "bold" }]}>Etap</Text>
            <Text style={[styles.colCriteria, { fontWeight: "bold" }]}>Kryteria akceptacji</Text>
            <Text style={[styles.colAmount, { fontWeight: "bold" }]}>Kwota (PLN)</Text>
            <Text style={[styles.colDue, { fontWeight: "bold" }]}>Termin</Text>
          </View>
          {data.milestones.map((m) => (
            <View key={m.idx} style={styles.tableRow}>
              <Text style={styles.colIdx}>{m.idx}</Text>
              <Text style={styles.colTitle}>{m.title}</Text>
              <Text style={styles.colCriteria}>{m.criteria || "—"}</Text>
              <Text style={styles.colAmount}>
                {Number(m.amount).toFixed(2)}
              </Text>
              <Text style={styles.colDue}>{m.dueAt || "—"}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SUMA CAŁKOWITA:</Text>
            <Text style={styles.totalAmount}>
              {data.totalAmount.toFixed(2)} {data.currency}
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          W tym prowizja platformy Student Impact: {data.platformFee.toFixed(2)} {data.currency} ({data.platformFeePercent}%)
        </Text>

        <Text style={styles.paragraph}>
          {CONTRACT_A_CLAUSES.payment(data.reviewWindowDays)}
        </Text>
        <Text style={styles.paragraph}>
          {CONTRACT_A_CLAUSES.acceptance(data.reviewWindowDays)}
        </Text>
        <Text style={styles.paragraph}>{CONTRACT_A_CLAUSES.ip}</Text>
      </Page>

      {/* Page 3: Remaining clauses + signatures */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.paragraph}>{CONTRACT_A_CLAUSES.confidentiality}</Text>
        <Text style={styles.paragraph}>{CONTRACT_A_CLAUSES.liability}</Text>
        <Text style={styles.paragraph}>{CONTRACT_A_CLAUSES.final}</Text>

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>WYKONAWCA (Platforma)</Text>
            <Text style={{ fontSize: 8, color: "#888", marginTop: 4 }}>
              {PLATFORM_ENTITY.name}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>ZLECENIODAWCA (Firma)</Text>
            <Text style={{ fontSize: 8, color: "#888", marginTop: 4 }}>
              {data.companyName}
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
