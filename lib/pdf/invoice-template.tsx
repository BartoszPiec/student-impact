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
import { PLATFORM_ENTITY } from "./legal-clauses-pl";
import type { InvoiceData } from "./types";

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    padding: 50,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderColor: "#4f46e5",
    paddingBottom: 15,
  },
  headerLeft: {
    width: "50%",
  },
  headerRight: {
    width: "40%",
    textAlign: "right",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4f46e5",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#666",
  },
  invoiceDate: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  partyBlock: {
    width: "45%",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.6,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
    borderRadius: 3,
    padding: 8,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#e5e7eb",
    padding: 8,
    backgroundColor: "#f9fafb",
  },
  colIdx: { width: "8%", fontSize: 9 },
  colDesc: { width: "50%", fontSize: 9 },
  colQty: { width: "10%", fontSize: 9, textAlign: "center" },
  colPrice: { width: "16%", fontSize: 9, textAlign: "right" },
  colTotal: { width: "16%", fontSize: 9, textAlign: "right" },
  summaryBlock: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#555",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  totalRow: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderColor: "#4f46e5",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4f46e5",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: "#555",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
});

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>FAKTURA</Text>
            <Text style={styles.invoiceNumber}>Nr {data.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Data wystawienia: {data.issuedAt}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 12, fontWeight: "bold", color: "#4f46e5" }}>
              {PLATFORM_ENTITY.name}
            </Text>
            <Text style={{ fontSize: 9, color: "#666", marginTop: 4 }}>
              {PLATFORM_ENTITY.address}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {PLATFORM_ENTITY.city}
            </Text>
            <Text style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
              NIP: {PLATFORM_ENTITY.nip}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Sprzedawca</Text>
            <Text style={styles.partyName}>{data.issuerName}</Text>
            <Text style={styles.partyDetail}>{data.issuerAddress}</Text>
            <Text style={styles.partyDetail}>NIP: {data.issuerNip}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Nabywca</Text>
            <Text style={styles.partyName}>{data.recipientName}</Text>
            <Text style={styles.partyDetail}>{data.recipientAddress}</Text>
            {data.recipientNip && (
              <Text style={styles.partyDetail}>NIP: {data.recipientNip}</Text>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colIdx]}>Lp.</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Opis</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Ilość</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Cena jedn.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Wartość</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
              <Text style={styles.colIdx}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBlock}>
          {data.platformFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prowizja platformy:</Text>
              <Text style={styles.summaryValue}>{data.platformFee.toFixed(2)} {data.currency}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Wartość netto:</Text>
            <Text style={styles.summaryValue}>{data.totalNet.toFixed(2)} {data.currency}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>DO ZAPŁATY:</Text>
            <Text style={styles.totalValue}>{data.totalGross.toFixed(2)} {data.currency}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Informacje dodatkowe</Text>
          <Text style={styles.notesText}>
            Płatność obsługiwana przez platformę Student Impact.{"\n"}
            Metoda płatności: {data.paymentMethod}.{"\n"}
            Nr kontraktu: {data.contractId.slice(0, 8).toUpperCase()}.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Wygenerowano automatycznie przez platformę Student Impact | {data.invoiceNumber} | {data.issuedAt}
        </Text>
      </Page>
    </Document>
  );
}
