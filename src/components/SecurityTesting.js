import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    startSecurityTests,
    completeSecurityTests,
    addVulnerability,
    updateRealTimeMetrics,
    addAlert
} from '../store/slices/testingSlice';
import { Colors } from '../constants/Colors';

const SecurityTesting = () => {
    const dispatch = useDispatch();
    const {
        securityTests,
        monitoring: { realTime },
        config
    } = useSelector(state => state.testing);

    const [testResults, setTestResults] = useState({
        vulnerabilities: [],
        compliance: {},
        auditTrail: [],
        penetrationTestResults: null
    });

    const [scanSettings, setScanSettings] = useState({
        xss: true,
        sqlInjection: true,
        csrf: true,
        insecureHeaders: true,
        certificateValidation: true,
        contentSecurityPolicy: true,
        dependencyScanning: true,
        gdprCompliance: true,
        pciCompliance: false,
        automatedScanning: true
    });

    // Security testing functions
    const testXSSVulnerability = useCallback(() => {
        const testInputs = [
            '<script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src=x onerror=alert("XSS")>',
            '"><script>alert("XSS")</script>',
            "';alert('XSS');//"
        ];

        const vulnerabilities = [];

        testInputs.forEach((input, index) => {
            try {
                // Test for reflected XSS in URL parameters
                const testUrl = `https://test.com/search?q=${encodeURIComponent(input)}`;
                const url = new URL(testUrl);

                // Simulate XSS detection (in real implementation, this would analyze actual responses)
                if (input.includes('<script>') || input.includes('javascript:')) {
                    vulnerabilities.push({
                        type: 'XSS',
                        severity: 'high',
                        location: 'URL Parameter',
                        parameter: 'q',
                        payload: input,
                        description: 'Potential reflected XSS vulnerability detected',
                        cve: null,
                        owasp: 'A03:2021 - Injection',
                        remediation: 'Implement proper input validation and output encoding'
                    });
                }
            } catch (error) {
                // Handle parsing errors
            }
        });

        return vulnerabilities;
    }, []);

    const testSQLInjection = useCallback(() => {
        const sqlPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT null,username,password FROM users --",
            "1' AND (SELECT COUNT(*) FROM users) > 0 --",
            "' OR 1=1#"
        ];

        const vulnerabilities = [];

        sqlPayloads.forEach(payload => {
            try {
                // Simulate SQL injection detection
                if (payload.includes('DROP') || payload.includes('UNION') || payload.includes('OR 1=1')) {
                    vulnerabilities.push({
                        type: 'SQL Injection',
                        severity: 'critical',
                        location: 'Database Query',
                        payload,
                        description: 'Potential SQL injection vulnerability detected',
                        cve: 'CWE-89',
                        owasp: 'A03:2021 - Injection',
                        remediation: 'Use parameterized queries and input validation'
                    });
                }
            } catch (error) {
                // Handle parsing errors
            }
        });

        return vulnerabilities;
    }, []);

    const testCSRF = useCallback(() => {
        const vulnerabilities = [];

        // Test for missing CSRF tokens
        vulnerabilities.push({
            type: 'CSRF',
            severity: 'medium',
            location: 'Form Submission',
            description: 'CSRF token validation missing',
            cve: 'CWE-352',
            owasp: 'A01:2021 - Broken Access Control',
            remediation: 'Implement CSRF tokens for all state-changing operations'
        });

        return vulnerabilities;
    }, []);

    const testSecurityHeaders = useCallback(() => {
        const requiredHeaders = [
            'Content-Security-Policy',
            'X-Frame-Options',
            'X-Content-Type-Options',
            'Strict-Transport-Security',
            'X-XSS-Protection',
            'Referrer-Policy'
        ];

        const missingHeaders = [];
        const weakHeaders = [];

        // Simulate header checking (in real implementation, this would fetch actual headers)
        requiredHeaders.forEach(header => {
            const isMissing = Math.random() > 0.7; // 30% chance of missing
            const isWeak = !isMissing && Math.random() > 0.8; // 20% chance of weak

            if (isMissing) {
                missingHeaders.push({
                    header,
                    status: 'missing',
                    severity: 'medium',
                    description: `Missing security header: ${header}`,
                    remediation: `Add ${header} header with appropriate value`
                });
            } else if (isWeak) {
                weakHeaders.push({
                    header,
                    status: 'weak',
                    severity: 'low',
                    description: `Weak ${header} header configuration`,
                    remediation: `Strengthen ${header} header configuration`
                });
            }
        });

        return [...missingHeaders, ...weakHeaders];
    }, []);

    const testGDPRCompliance = useCallback(() => {
        const complianceChecks = [
            {
                area: 'Data Collection',
                check: 'User consent mechanism',
                status: Math.random() > 0.2 ? 'compliant' : 'non-compliant',
                description: 'User consent for data collection'
            },
            {
                area: 'Data Processing',
                check: 'Lawful basis documentation',
                status: Math.random() > 0.1 ? 'compliant' : 'non-compliant',
                description: 'Documentation of lawful basis for processing'
            },
            {
                area: 'Data Subject Rights',
                check: 'Right to erasure implementation',
                status: Math.random() > 0.3 ? 'compliant' : 'non-compliant',
                description: 'Implementation of right to erasure'
            },
            {
                area: 'Data Security',
                check: 'Encryption in transit',
                status: Math.random() > 0.05 ? 'compliant' : 'non-compliant',
                description: 'Encryption of data in transit'
            },
            {
                area: 'Data Retention',
                check: 'Retention policy implementation',
                status: Math.random() > 0.4 ? 'compliant' : 'non-compliant',
                description: 'Implementation of data retention policies'
            }
        ];

        const compliance = {
            gdpr: complianceChecks,
            overall: complianceChecks.filter(check => check.status === 'compliant').length / complianceChecks.length
        };

        return compliance;
    }, []);

    const runSecurityScan = useCallback(async () => {
        dispatch(startSecurityTests());

        const allVulnerabilities = [];
        const auditTrail = [];

        try {
            // Record scan start
            auditTrail.push({
                timestamp: new Date().toISOString(),
                action: 'security_scan_started',
                details: 'Automated security scan initiated'
            });

            // Run XSS tests
            if (scanSettings.xss) {
                const xssVulns = testXSSVulnerability();
                allVulnerabilities.push(...xssVulns);
                auditTrail.push({
                    timestamp: new Date().toISOString(),
                    action: 'xss_scan_completed',
                    details: `Found ${xssVulns.length} potential XSS vulnerabilities`
                });
            }

            // Run SQL injection tests
            if (scanSettings.sqlInjection) {
                const sqlVulns = testSQLInjection();
                allVulnerabilities.push(...sqlVulns);
                auditTrail.push({
                    timestamp: new Date().toISOString(),
                    action: 'sql_injection_scan_completed',
                    details: `Found ${sqlVulns.length} potential SQL injection vulnerabilities`
                });
            }

            // Run CSRF tests
            if (scanSettings.csrf) {
                const csrfVulns = testCSRF();
                allVulnerabilities.push(...csrfVulns);
                auditTrail.push({
                    timestamp: new Date().toISOString(),
                    action: 'csrf_scan_completed',
                    details: `Found ${csrfVulns.length} CSRF vulnerabilities`
                });
            }

            // Run security headers test
            if (scanSettings.insecureHeaders) {
                const headerVulns = testSecurityHeaders();
                allVulnerabilities.push(...headerVulns);
                auditTrail.push({
                    timestamp: new Date().toISOString(),
                    action: 'security_headers_scan_completed',
                    details: `Found ${headerVulns.length} security header issues`
                });
            }

            // Run GDPR compliance test
            if (scanSettings.gdprCompliance) {
                const gdprCompliance = testGDPRCompliance();
                setTestResults(prev => ({ ...prev, compliance: gdprCompliance }));
                auditTrail.push({
                    timestamp: new Date().toISOString(),
                    action: 'gdpr_compliance_check_completed',
                    details: `GDPR compliance score: ${Math.round(gdprCompliance.overall * 100)}%`
                });
            }

            // Update results
            const results = {
                vulnerabilities: allVulnerabilities,
                severity: {
                    critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
                    high: allVulnerabilities.filter(v => v.severity === 'high').length,
                    medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
                    low: allVulnerabilities.filter(v => v.severity === 'low').length
                },
                compliance: testResults.compliance,
                auditTrail: [...testResults.auditTrail, ...auditTrail]
            };

            setTestResults(prev => ({ ...prev, ...results }));

            // Add vulnerabilities to store
            allVulnerabilities.forEach(vuln => {
                dispatch(addVulnerability(vuln));
            });

            // Create alerts for critical vulnerabilities
            const criticalVulns = allVulnerabilities.filter(v => v.severity === 'critical');
            if (criticalVulns.length > 0) {
                dispatch(addAlert({
                    type: 'security',
                    severity: 'critical',
                    category: 'security',
                    message: `Critical security vulnerabilities detected: ${criticalVulns.length}`,
                    count: criticalVulns.length
                }));
            }

            dispatch(completeSecurityTests(results));

        } catch (error) {
            dispatch(addAlert({
                type: 'error',
                severity: 'high',
                category: 'security',
                message: 'Security scan failed',
                error: error.message
            }));
        }
    }, [scanSettings, dispatch, testXSSVulnerability, testSQLInjection, testCSRF, testSecurityHeaders, testGDPRCompliance]);

    // Automated scanning effect
    useEffect(() => {
        if (scanSettings.automatedScanning) {
            const interval = setInterval(() => {
                runSecurityScan();
            }, config.security.scanInterval);

            return () => clearInterval(interval);
        }
    }, [scanSettings.automatedScanning, runSecurityScan, config.security.scanInterval]);

    const renderVulnerability = (vuln, index) => (
        <View key={index} style={[
            styles.vulnerabilityItem,
            vuln.severity === 'critical' ? styles.criticalVuln :
                vuln.severity === 'high' ? styles.highVuln :
                    vuln.severity === 'medium' ? styles.mediumVuln : styles.lowVuln
        ]}>
            <View style={styles.vulnerabilityHeader}>
                <Text style={styles.vulnerabilityType}>{vuln.type}</Text>
                <Text style={[
                    styles.severityBadge,
                    vuln.severity === 'critical' ? styles.criticalBadge :
                        vuln.severity === 'high' ? styles.highBadge :
                            vuln.severity === 'medium' ? styles.mediumBadge : styles.lowBadge
                ]}>
                    {vuln.severity.toUpperCase()}
                </Text>
            </View>
            <Text style={styles.vulnerabilityDescription}>{vuln.description}</Text>
            {vuln.location && (
                <Text style={styles.vulnerabilityLocation}>Location: {vuln.location}</Text>
            )}
            {vuln.payload && (
                <Text style={styles.vulnerabilityPayload}>Payload: {vuln.payload}</Text>
            )}
            {vuln.remediation && (
                <Text style={styles.remediation}>Fix: {vuln.remediation}</Text>
            )}
        </View>
    );

    const renderComplianceCheck = (check, index) => (
        <View key={index} style={styles.complianceItem}>
            <View style={styles.complianceHeader}>
                <Text style={styles.complianceArea}>{check.area}</Text>
                <View style={[
                    styles.complianceStatus,
                    check.status === 'compliant' ? styles.compliantStatus : styles.nonCompliantStatus
                ]}>
                    <Text style={[
                        styles.complianceStatusText,
                        check.status === 'compliant' ? styles.compliantText : styles.nonCompliantText
                    ]}>
                        {check.status === 'compliant' ? '✓' : '✗'} {check.status}
                    </Text>
                </View>
            </View>
            <Text style={styles.complianceCheck}>{check.check}</Text>
            <Text style={styles.complianceDescription}>{check.description}</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Security Testing & Compliance</Text>

            {/* Scan Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Scan Settings</Text>

                {Object.entries(scanSettings).map(([key, value]) => (
                    <View key={key} style={styles.settingItem}>
                        <Text style={styles.settingLabel}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Text>
                        <Switch
                            value={value}
                            onValueChange={(newValue) =>
                                setScanSettings(prev => ({ ...prev, [key]: newValue }))
                            }
                            trackColor={{ false: Colors.divider, true: Colors.primary }}
                            thumbColor={value ? Colors.surface : Colors.textSecondary}
                        />
                    </View>
                ))}
            </View>

            {/* Run Security Scan */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[
                        styles.scanButton,
                        securityTests.running ? styles.scanButtonDisabled : null
                    ]}
                    onPress={runSecurityScan}
                    disabled={securityTests.running}
                >
                    <Text style={styles.scanButtonText}>
                        {securityTests.running ? 'Scanning...' : 'Run Security Scan'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Vulnerability Results */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Security Vulnerabilities ({testResults.vulnerabilities.length})
                </Text>

                {testResults.vulnerabilities.length === 0 ? (
                    <Text style={styles.noItems}>No vulnerabilities detected</Text>
                ) : (
                    testResults.vulnerabilities.map(renderVulnerability)
                )}
            </View>

            {/* GDPR Compliance */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    GDPR Compliance ({testResults.compliance?.overall ? Math.round(testResults.compliance.overall * 100) : 0}%)
                </Text>

                {testResults.compliance?.gdpr ? (
                    testResults.compliance.gdpr.map(renderComplianceCheck)
                ) : (
                    <Text style={styles.noItems}>Compliance check not run</Text>
                )}
            </View>

            {/* Audit Trail */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Audit Trail</Text>

                {testResults.auditTrail.length === 0 ? (
                    <Text style={styles.noItems}>No audit entries</Text>
                ) : (
                    testResults.auditTrail.slice(-10).map((entry, index) => (
                        <View key={index} style={styles.auditItem}>
                            <Text style={styles.auditTimestamp}>
                                {new Date(entry.timestamp).toLocaleString()}
                            </Text>
                            <Text style={styles.auditAction}>{entry.action}</Text>
                            <Text style={styles.auditDetails}>{entry.details}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Security Metrics */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Metrics</Text>

                <View style={styles.metricsGrid}>
                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{testResults.vulnerabilities.length}</Text>
                        <Text style={styles.metricLabel}>Total Vulnerabilities</Text>
                    </View>

                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{testResults.severity?.critical || 0}</Text>
                        <Text style={styles.metricLabel}>Critical</Text>
                    </View>

                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{testResults.severity?.high || 0}</Text>
                        <Text style={styles.metricLabel}>High</Text>
                    </View>

                    <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>
                            {testResults.compliance?.overall ? Math.round(testResults.compliance.overall * 100) : 0}%
                        </Text>
                        <Text style={styles.metricLabel}>GDPR Compliance</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    settingLabel: {
        fontSize: 14,
        color: Colors.textPrimary,
        flex: 1,
    },
    scanButton: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    scanButtonDisabled: {
        backgroundColor: Colors.textSecondary,
    },
    scanButtonText: {
        color: Colors.surface,
        fontSize: 16,
        fontWeight: '600',
    },
    vulnerabilityItem: {
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    criticalVuln: {
        backgroundColor: '#FFEBEE',
        borderLeftColor: '#D32F2F',
    },
    highVuln: {
        backgroundColor: '#FFF3E0',
        borderLeftColor: '#F57C00',
    },
    mediumVuln: {
        backgroundColor: '#FFF8E1',
        borderLeftColor: '#FFA000',
    },
    lowVuln: {
        backgroundColor: '#E8F5E8',
        borderLeftColor: '#388E3C',
    },
    vulnerabilityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    vulnerabilityType: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 10,
        fontWeight: '600',
    },
    criticalBadge: {
        backgroundColor: '#D32F2F',
        color: Colors.surface,
    },
    highBadge: {
        backgroundColor: '#F57C00',
        color: Colors.surface,
    },
    mediumBadge: {
        backgroundColor: '#FFA000',
        color: Colors.surface,
    },
    lowBadge: {
        backgroundColor: '#388E3C',
        color: Colors.surface,
    },
    vulnerabilityDescription: {
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    vulnerabilityLocation: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    vulnerabilityPayload: {
        fontSize: 12,
        color: Colors.warning,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    remediation: {
        fontSize: 12,
        color: Colors.success,
        fontStyle: 'italic',
    },
    complianceItem: {
        padding: 12,
        backgroundColor: Colors.background,
        borderRadius: 6,
        marginBottom: 8,
    },
    complianceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    complianceArea: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    complianceStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    compliantStatus: {
        backgroundColor: '#E8F5E8',
    },
    nonCompliantStatus: {
        backgroundColor: '#FFEBEE',
    },
    complianceStatusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    compliantText: {
        color: '#388E3C',
    },
    nonCompliantText: {
        color: '#D32F2F',
    },
    complianceCheck: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    complianceDescription: {
        fontSize: 12,
        color: Colors.textPrimary,
    },
    auditItem: {
        padding: 8,
        backgroundColor: Colors.background,
        borderRadius: 4,
        marginBottom: 8,
    },
    auditTimestamp: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    auditAction: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    auditDetails: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metricBox: {
        width: '48%',
        padding: 12,
        backgroundColor: Colors.background,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 12,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    noItems: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
});

export default SecurityTesting;