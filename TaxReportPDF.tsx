
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { TaxInputs, TaxResult } from './types';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottomWidth: 2,
        borderBottomColor: '#0f172a',
        paddingBottom: 20,
        marginBottom: 30,
    },
    headerLeft: {
        flexDirection: 'column',
    },
    title: {
        fontSize: 24,
        fontWeight: 'extrabold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 9,
        color: '#64748b',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginTop: 4,
    },
    headerRight: {
        textAlign: 'right',
    },
    periodText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    arcaText: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: 'bold',
        marginTop: 2,
    },
    grid: {
        flexDirection: 'row',
        gap: 30,
        marginBottom: 30,
    },
    card: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    cardTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    rowLabel: {
        fontSize: 10,
        color: '#475569',
    },
    rowValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    highlightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        marginTop: 5,
    },
    highlightLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#e11d48',
        textTransform: 'uppercase',
    },
    highlightValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#e11d48',
    },
    netRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#cbd5e1',
    },
    netLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#059669',
        textTransform: 'uppercase',
    },
    netValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#059669',
    },
    infoCol: {
        flex: 1,
        padding: 10,
    },
    infoRow: {
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 7,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 10,
        color: '#1e293b',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#4f46e5',
        paddingLeft: 10,
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0f172a',
        padding: 8,
    },
    tableHeaderCell: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        padding: 8,
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
    },
    tableTotal: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footer: {
        marginTop: 50,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 8,
        color: '#cbd5e1',
    },
    finalCard: {
        backgroundColor: '#0f172a',
        padding: 25,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    finalLabel: {
        fontSize: 9,
        color: '#818cf8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    finalValue: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'bold',
    }
});

interface Props {
    inputs: TaxInputs;
    result: TaxResult;
    monthName: string;
}

const formatCurrency = (amount: number) => {
    return `$ ${Math.round(amount).toLocaleString('es-AR')}`;
};

export const TaxReportPDF: React.FC<Props> = ({ inputs, result, monthName }) => (
    <Document title={`Reporte_Ganancias_${monthName}_${inputs.period}`}>
        <Page size="A4" style={styles.page}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Liquidación de Ganancias</Text>
                    <Text style={styles.subtitle}>Reporte Técnico de Retención Mensual</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.periodText}>{monthName} {inputs.period}</Text>
                    <Text style={styles.arcaText}>ARCA (Ex-AFIP) Ley 27.743</Text>
                </View>
            </View>

            {/* SUMMARY GRID */}
            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Resumen de Haberes</Text>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Sueldo Bruto</Text>
                        <Text style={styles.rowValue}>{formatCurrency(inputs.grossSalary)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Neto Pre-Impuesto</Text>
                        <Text style={styles.rowValue}>{formatCurrency(result.netMonthlyPreTax)}</Text>
                    </View>
                    <View style={styles.highlightRow}>
                        <Text style={styles.highlightLabel}>Retención Ganancias</Text>
                        <Text style={styles.highlightValue}>{formatCurrency(result.monthlyTax)}</Text>
                    </View>
                    <View style={styles.netRow}>
                        <Text style={styles.netLabel}>Sueldo de Bolsillo</Text>
                        <Text style={styles.netValue}>{formatCurrency(result.netMonthlyPostTax)}</Text>
                    </View>
                </View>

                <View style={styles.infoCol}>
                    <Text style={styles.cardTitle}>Datos del Contribuyente</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Condición</Text>
                        <Text style={styles.infoValue}>{inputs.isIndependent ? 'Autónomo' : 'Relación de Dependencia'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cargas de Familia</Text>
                        <Text style={styles.infoValue}>{inputs.deductions.children + (inputs.deductions.spouse ? 1 : 0)} persona(s)</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tasa Efectiva</Text>
                        <Text style={styles.infoValue}>{((result.monthlyTax / (result.grossMonthly || 1)) * 100).toFixed(2)}%</Text>
                    </View>
                </View>
            </View>

            {/* DEDUCTIONS SECTION */}
            <View>
                <Text style={styles.sectionTitle}>Detalle de Deducciones Acumuladas</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Concepto</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Monto Acumulado</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>Ganancia No Imponible (MNI)</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.baseDeduction)}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>Deducción Especial (Inc. c)</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.specialDeduction)}</Text>
                    </View>

                    {result.breakdown.spouseAmount > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Carga: Cónyuge / Conviviente</Text>
                            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.spouseAmount)}</Text>
                        </View>
                    )}
                    {result.breakdown.childrenAmount > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Carga: Hijos / Hijastros</Text>
                            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.childrenAmount)}</Text>
                        </View>
                    )}
                    {result.breakdown.medicalInsuranceAmount > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Medicina Prepaga</Text>
                            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.medicalInsuranceAmount)}</Text>
                        </View>
                    )}
                    {result.breakdown.rentAmount > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Alquiler Vivienda (Tope MNI)</Text>
                            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.rentAmount)}</Text>
                        </View>
                    )}
                    {result.breakdown.educationAmount > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2 }]}>Gastos Educativos</Text>
                            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(result.breakdown.educationAmount)}</Text>
                        </View>
                    )}

                    <View style={styles.tableTotal}>
                        <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>TOTAL DEDUCCIONES COMPUTADAS</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatCurrency(result.totalDeductionsCumulative)}</Text>
                    </View>
                </View>
            </View>

            {/* FINAL CARD */}
            <View style={styles.finalCard}>
                <View>
                    <Text style={styles.finalLabel}>Base Imponible Acumulada</Text>
                    <Text style={[styles.finalValue, { fontSize: 16 }]}>{formatCurrency(result.taxableIncomeCumulative)}</Text>
                </View>
                <View style={{ textAlign: 'right' }}>
                    <Text style={styles.finalLabel}>Importe a Retener (Mes)</Text>
                    <Text style={styles.finalValue}>{formatCurrency(result.monthlyTax)}</Text>
                </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Este documento es una estimación informativa no vinculante.</Text>
                <Text style={styles.footerSubtext}>Calculadora Ganancias Argentina 🇦🇷</Text>
            </View>
        </Page>
    </Document>
);
