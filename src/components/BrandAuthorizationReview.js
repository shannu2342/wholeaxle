import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrandAuthorizations, reviewBrandAuthorization } from '../store/slices/brandSlice';

const BrandAuthorizationReview = ({ style }) => {
    const dispatch = useDispatch();
    const {
        authorizations,
        isLoading,
        isReviewing,
        error,
        success,
        pagination
    } = useSelector(state => state.brands);

    const [selectedAuthorization, setSelectedAuthorization] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'reject'
    const [reviewComments, setReviewComments] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending_review, approved, rejected

    useEffect(() => {
        loadAuthorizations();
    }, [filterStatus]);

    const loadAuthorizations = useCallback(async () => {
        try {
            await dispatch(fetchBrandAuthorizations({
                status: filterStatus === 'all' ? undefined : filterStatus,
                page: pagination.page,
                limit: pagination.limit
            })).unwrap();
        } catch (error) {
            console.error('Failed to load authorizations:', error);
        }
    }, [dispatch, filterStatus, pagination.page, pagination.limit]);

    const handleReview = async () => {
        if (!selectedAuthorization || !reviewAction) return;

        try {
            await dispatch(reviewBrandAuthorization({
                authorizationId: selectedAuthorization.id,
                action: reviewAction,
                comments: reviewComments
            })).unwrap();

            setShowReviewModal(false);
            setSelectedAuthorization(null);
            setReviewComments('');

            // Reload authorizations
            loadAuthorizations();

        } catch (error) {
            Alert.alert('Review Failed', 'Failed to process the review. Please try again.');
        }
    };

    const openReviewModal = (authorization, action) => {
        setSelectedAuthorization(authorization);
        setReviewAction(action);
        setReviewComments('');
        setShowReviewModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending_review': return '#FF9800';
            case 'approved': return '#4CAF50';
            case 'rejected': return '#F44336';
            default: return '#999';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending_review': return 'clock-o';
            case 'approved': return 'check-circle';
            case 'rejected': return 'times-circle';
            default: return 'question-circle';
        }
    };

    const renderAuthorizationItem = ({ item }) => (
        <TouchableOpacity
            style={styles.authorizationItem}
            onPress={() => setSelectedAuthorization(item)}
        >
            <View style={styles.authorizationHeader}>
                <View style={styles.brandInfo}>
                    <Text style={styles.brandName}>{item.brandName}</Text>
                    <Text style={styles.submissionDate}>
                        Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Icon
                        name={getStatusIcon(item.status)}
                        size={12}
                        color="#fff"
                        style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>
                        {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.authorizationDetails}>
                <Text style={styles.detailText}>
                    Documents: {item.documents?.length || 0} uploaded
                </Text>
                {item.reviewedAt && (
                    <Text style={styles.detailText}>
                        Reviewed: {new Date(item.reviewedAt).toLocaleDateString()}
                    </Text>
                )}
                {item.reviewedBy && (
                    <Text style={styles.detailText}>
                        Reviewer: {item.reviewedBy}
                    </Text>
                )}
            </View>

            {item.status === 'pending_review' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => openReviewModal(item, 'approve')}
                        disabled={isReviewing}
                    >
                        <Icon name="check" size={14} color="#fff" />
                        <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => openReviewModal(item, 'reject')}
                        disabled={isReviewing}
                    >
                        <Icon name="times" size={14} color="#fff" />
                        <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderReviewModal = () => (
        <Modal
            visible={showReviewModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowReviewModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                        <Text style={styles.closeButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        {reviewAction === 'approve' ? 'Approve' : 'Reject'} Authorization
                    </Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.modalContent}>
                    {selectedAuthorization && (
                        <View style={styles.authorizationSummary}>
                            <Text style={styles.summaryBrandName}>{selectedAuthorization.brandName}</Text>
                            <Text style={styles.summaryDetail}>
                                Submitted: {new Date(selectedAuthorization.submittedAt).toLocaleDateString()}
                            </Text>
                            <Text style={styles.summaryDetail}>
                                Documents: {selectedAuthorization.documents?.length || 0}
                            </Text>
                        </View>
                    )}

                    <View style={styles.documentsSection}>
                        <Text style={styles.sectionTitle}>Submitted Documents</Text>
                        {selectedAuthorization?.documents?.map((doc, index) => (
                            <View key={index} style={styles.documentItem}>
                                <Icon name="file-o" size={16} color="#0390F3" />
                                <Text style={styles.documentName}>{doc.fileName}</Text>
                                <View style={[styles.documentStatus, {
                                    backgroundColor: doc.status === 'approved' ? '#4CAF50' : '#FF9800'
                                }]}>
                                    <Text style={styles.documentStatusText}>
                                        {doc.status?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.reviewSection}>
                        <Text style={styles.sectionTitle}>Review Comments</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder={`Add comments for ${reviewAction}...`}
                            value={reviewComments}
                            onChangeText={setReviewComments}
                            multiline
                            numberOfLines={4}
                        />
                        <Text style={styles.helperText}>
                            Comments will be shared with the applicant
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitReviewButton,
                            reviewAction === 'approve' ? styles.approveButton : styles.rejectButton,
                            isReviewing && styles.submitButtonDisabled
                        ]}
                        onPress={handleReview}
                        disabled={isReviewing}
                    >
                        {isReviewing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon
                                    name={reviewAction === 'approve' ? 'check' : 'times'}
                                    size={16}
                                    color="#fff"
                                />
                                <Text style={styles.submitReviewText}>
                                    {reviewAction === 'approve' ? 'Approve Authorization' : 'Reject Authorization'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );

    const renderDetailModal = () => (
        <Modal
            visible={!!selectedAuthorization && !showReviewModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedAuthorization(null)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setSelectedAuthorization(null)}>
                        <Text style={styles.closeButton}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Authorization Details</Text>
                    <View style={{ width: 60 }} />
                </View>

                {selectedAuthorization && (
                    <ScrollView style={styles.modalContent}>
                        <View style={styles.detailSection}>
                            <Text style={styles.detailBrandName}>{selectedAuthorization.brandName}</Text>
                            <View style={[styles.statusBadge, {
                                backgroundColor: getStatusColor(selectedAuthorization.status)
                            }]}>
                                <Icon
                                    name={getStatusIcon(selectedAuthorization.status)}
                                    size={14}
                                    color="#fff"
                                />
                                <Text style={styles.statusText}>
                                    {selectedAuthorization.status.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Submitted:</Text>
                            <Text style={styles.infoValue}>
                                {new Date(selectedAuthorization.submittedAt).toLocaleString()}
                            </Text>
                        </View>

                        {selectedAuthorization.reviewedAt && (
                            <View style={styles.infoSection}>
                                <Text style={styles.infoLabel}>Reviewed:</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(selectedAuthorization.reviewedAt).toLocaleString()}
                                </Text>
                            </View>
                        )}

                        {selectedAuthorization.reviewedBy && (
                            <View style={styles.infoSection}>
                                <Text style={styles.infoLabel}>Reviewed by:</Text>
                                <Text style={styles.infoValue}>{selectedAuthorization.reviewedBy}</Text>
                            </View>
                        )}

                        {selectedAuthorization.reviewComments && (
                            <View style={styles.infoSection}>
                                <Text style={styles.infoLabel}>Review Comments:</Text>
                                <Text style={styles.infoValue}>{selectedAuthorization.reviewComments}</Text>
                            </View>
                        )}

                        <View style={styles.documentsSection}>
                            <Text style={styles.sectionTitle}>Documents ({selectedAuthorization.documents?.length || 0})</Text>
                            {selectedAuthorization.documents?.map((doc, index) => (
                                <View key={index} style={styles.documentItem}>
                                    <Icon name="file-o" size={20} color="#0390F3" />
                                    <View style={styles.documentInfo}>
                                        <Text style={styles.documentName}>{doc.fileName}</Text>
                                        <Text style={styles.documentType}>
                                            {doc.type?.replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[styles.documentStatus, {
                                        backgroundColor: getStatusColor(doc.status)
                                    }]}>
                                        <Text style={styles.documentStatusText}>
                                            {doc.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {selectedAuthorization.status === 'pending_review' && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => openReviewModal(selectedAuthorization, 'approve')}
                                    disabled={isReviewing}
                                >
                                    <Icon name="check" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => openReviewModal(selectedAuthorization, 'reject')}
                                    disabled={isReviewing}
                                >
                                    <Icon name="times" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, style]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Brand Authorization Review</Text>
                <Text style={styles.subtitle}>
                    Review and manage brand authorization requests
                </Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {['all', 'pending_review', 'approved', 'rejected'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterTab,
                            filterStatus === status && styles.filterTabActive
                        ]}
                        onPress={() => setFilterStatus(status)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            filterStatus === status && styles.filterTabTextActive
                        ]}>
                            {status.replace('_', ' ').toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {authorizations.filter(a => a.status === 'pending_review').length}
                    </Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {authorizations.filter(a => a.status === 'approved').length}
                    </Text>
                    <Text style={styles.statLabel}>Approved</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {authorizations.filter(a => a.status === 'rejected').length}
                    </Text>
                    <Text style={styles.statLabel}>Rejected</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{authorizations.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </View>

            {/* Authorizations List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0390F3" />
                    <Text style={styles.loadingText}>Loading authorizations...</Text>
                </View>
            ) : (
                <FlatList
                    data={authorizations}
                    renderItem={renderAuthorizationItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {renderReviewModal()}
            {renderDetailModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#f5f5f5',
    },
    filterTabActive: {
        backgroundColor: '#0390F3',
    },
    filterTabText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    filterTabTextActive: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginTop: 1,
        paddingVertical: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '600',
        color: '#0390F3',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    listContainer: {
        padding: 16,
    },
    authorizationItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    authorizationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    brandInfo: {
        flex: 1,
    },
    brandName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    submissionDate: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusIcon: {
        marginRight: 4,
    },
    statusText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    authorizationDetails: {
        marginBottom: 12,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        fontSize: 16,
        color: '#0390F3',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    authorizationSummary: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    summaryBrandName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    summaryDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    detailSection: {
        marginBottom: 20,
    },
    detailBrandName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    infoSection: {
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    documentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    documentName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        marginBottom: 2,
    },
    documentType: {
        fontSize: 12,
        color: '#666',
    },
    documentStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    documentStatusText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    documentsSection: {
        marginBottom: 20,
    },
    reviewSection: {
        marginBottom: 20,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#f9f9f9',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    submitReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitReviewText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 8,
    },
});

export default BrandAuthorizationReview;