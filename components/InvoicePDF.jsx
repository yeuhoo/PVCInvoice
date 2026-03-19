import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
  },
  blueBar: {
    height: 4,
    backgroundColor: "#3b49df",
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 80,
    backgroundColor: "#6b7bc9",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 48,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 9,
    color: "#ffffff",
    marginTop: 2,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  invoiceFor: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 10,
    color: "#666666",
  },
  invoiceDetails: {
    alignItems: "flex-end",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 180,
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
  },
  detailValue: {
    fontSize: 10,
    color: "#333333",
  },
  divider: {
    height: 1,
    backgroundColor: "#cccccc",
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
    marginBottom: 15,
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowGray: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRowTotal: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  tableCol1: {
    flex: 1,
    fontSize: 10,
    color: "#374151",
  },
  tableCol2: {
    width: 100,
    fontSize: 10,
    color: "#374151",
    textAlign: "right",
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
  },
  employeeCalc: {
    fontSize: 9,
    color: "#6b7280",
    marginLeft: 20,
  },
  savingsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
  },
  savingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
    marginBottom: 2,
  },
  savingsLabel: {
    fontSize: 10,
    color: "#374151",
    textAlign: "right",
    flex: 1,
  },
  savingsValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    width: 100,
    textAlign: "right",
  },
  totalSavingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#e5e7eb",
    marginTop: 5,
  },
  totalSavingsLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    textAlign: "right",
    flex: 1,
  },
  totalSavingsValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    width: 100,
    textAlign: "right",
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export const InvoicePDF = ({ invoice }) => {
  console.log("InvoicePDF - Full invoice object:", invoice);
  console.log("InvoicePDF - employeeRate:", invoice.employeeRate);

  const premium = parseFloat(invoice.premium || 0);
  const claimPayment = parseFloat(invoice.claimPayment || 0);
  const totalDifference = premium - claimPayment;
  const noOfEmployees = parseInt(invoice.noOfEmployees || 0);
  const ratePerEmployee = parseFloat(invoice.employeeRate || 7.5);

  console.log("InvoicePDF - Calculated ratePerEmployee:", ratePerEmployee);

  const adminFee = noOfEmployees * ratePerEmployee;
  const totalInvoice = totalDifference + adminFee;

  // Calculate savings
  const premiumSavings = totalDifference * 0.706; // Approximately 70.6% of difference
  const totalWeeklySavings = premiumSavings - adminFee;

  const status = invoice.record?.status || "Weekly";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Blue bar at top */}
        <View style={styles.blueBar} />

        {/* Logo section */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>PVC</Text>
            <Text style={styles.logoSubtext}>Preventive Virtual Care</Text>
          </View>
        </View>

        {/* Invoice header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceFor}>
            <Text style={styles.label}>Invoice for</Text>
            <Text style={styles.clientName}>
              {invoice.client?.name || "N/A"}
            </Text>
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DATE:</Text>
              <Text style={styles.detailValue}>
                {formatDate(invoice.checkDate || invoice.createdAt)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #</Text>
              <Text style={styles.detailValue}>
                {invoice.invoiceNumber || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Description</Text>
          <View style={styles.table}>
            {/* Premium Payment */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Premium Payment:</Text>
              <Text style={styles.tableCol2}>{formatCurrency(premium)}</Text>
            </View>

            {/* Claim Payment */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Claim Payment:</Text>
              <Text style={styles.tableCol2}>
                {formatCurrency(claimPayment)}
              </Text>
            </View>

            {/* Total Difference */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol1, styles.boldText]}>
                Total Difference:
              </Text>
              <Text style={[styles.tableCol2, styles.boldText]}>
                {formatCurrency(totalDifference)}
              </Text>
            </View>

            {/* Employee calculation */}
            <View style={styles.tableRowGray}>
              <View style={{ flex: 1 }}>
                <Text style={styles.employeeCalc}>
                  {noOfEmployees} Employees x ${ratePerEmployee} {status}:
                </Text>
              </View>
              <Text style={styles.tableCol2}>{formatCurrency(adminFee)}</Text>
            </View>

            {/* Total Invoice */}
            <View style={styles.tableRowTotal}>
              <Text style={[styles.tableCol1, styles.boldText]}>
                Total Invoice:
              </Text>
              <Text style={[styles.tableCol2, styles.boldText]}>
                {formatCurrency(totalInvoice)}
              </Text>
            </View>
          </View>
        </View>

        {/* Savings section */}
        <View style={styles.savingsSection}>
          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Premium Savings</Text>
            <Text style={styles.savingsValue}>
              {formatCurrency(premiumSavings)}
            </Text>
          </View>
          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Admin Fee</Text>
            <Text style={styles.savingsValue}>{formatCurrency(adminFee)}</Text>
          </View>
          <View style={styles.totalSavingsRow}>
            <Text style={styles.totalSavingsLabel}>
              Total {status} Net Savings
            </Text>
            <Text style={styles.totalSavingsValue}>
              {formatCurrency(totalWeeklySavings)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
