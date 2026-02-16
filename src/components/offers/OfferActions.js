import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../constants/Colors';
import {
    acceptOffer,
    rejectOffer,
    canAcceptOffer,
    canRejectOffer,
    canCounterOffer,
    getVendorCounterMeta,
} from '../../store/slices/offersSlice';

const OfferActions = ({ offer, onActionComplete, style }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const counterMeta = getVendorCounterMeta(offer || {});

    const handleAcceptOffer = async () => {
        Alert.alert(
            'Accept Offer',
            'Are you sure you want to accept this offer?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Accept',
                    onPress: async () => {
                        try {
                            const result = await dispatch(acceptOffer({
                                offerId: offer.id,
                                userId: user.id
                            }));

                            if (acceptOffer.fulfilled.match(result)) {
                                onActionComplete && onActionComplete('accepted', offer);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to accept offer. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectOffer = () => {
        Alert.alert(
            'Reject Offer',
            'Are you sure you want to reject this offer?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await dispatch(rejectOffer({
                                offerId: offer.id,
                                userId: user.id,
                                reason: 'User rejected the offer'
                            }));

                            if (rejectOffer.fulfilled.match(result)) {
                                onActionComplete && onActionComplete('rejected', offer);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject offer. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleCounterOffer = () => {
        onActionComplete && onActionComplete('counter', offer);
    };

    const renderActionButton = (icon, text, onPress, styleType = 'default') => {
        const buttonStyle = [
            styles.actionButton,
            styleType === 'accept' && styles.acceptButton,
            styleType === 'reject' && styles.rejectButton,
            styleType === 'counter' && styles.counterButton,
        ];

        const textStyle = [
            styles.actionButtonText,
            styleType === 'accept' && styles.acceptButtonText,
            styleType === 'reject' && styles.rejectButtonText,
            styleType === 'counter' && styles.counterButtonText,
        ];

        return (
            <TouchableOpacity style={buttonStyle} onPress={onPress}>
                <Icon name={icon} size={16} color={
                    styleType === 'accept' ? COLORS.WHITE :
                        styleType === 'reject' ? COLORS.WHITE :
                            styleType === 'counter' ? COLORS.WHITE :
                                COLORS.PRIMARY
                } />
                <Text style={textStyle}>{text}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, style]}>
            {canAcceptOffer(offer) && renderActionButton(
                'check',
                'Accept',
                handleAcceptOffer,
                'accept'
            )}

            {canCounterOffer(offer) && renderActionButton(
                'swap-horiz',
                `Counter (${counterMeta.remaining} left)`,
                handleCounterOffer,
                'counter'
            )}

            {!canCounterOffer(offer) && counterMeta.max > 0 && counterMeta.remaining === 0 && (
                <View style={[styles.actionButton, styles.counterLimitButton]}>
                    <Icon name="block" size={16} color={COLORS.GRAY_500} />
                    <Text style={styles.counterLimitButtonText}>Max limit reached</Text>
                </View>
            )}

            {canRejectOffer(offer) && renderActionButton(
                'close',
                'Reject',
                handleRejectOffer,
                'reject'
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        backgroundColor: COLORS.WHITE,
        minWidth: 80,
    },
    acceptButton: {
        backgroundColor: COLORS.SUCCESS,
        borderColor: COLORS.SUCCESS,
    },
    rejectButton: {
        backgroundColor: COLORS.ERROR,
        borderColor: COLORS.ERROR,
    },
    counterButton: {
        backgroundColor: COLORS.PRIMARY,
        borderColor: COLORS.PRIMARY,
    },
    counterLimitButton: {
        borderColor: COLORS.GRAY_300,
        backgroundColor: COLORS.GRAY_100,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.PRIMARY,
        marginLeft: 4,
    },
    acceptButtonText: {
        color: COLORS.WHITE,
    },
    rejectButtonText: {
        color: COLORS.WHITE,
    },
    counterButtonText: {
        color: COLORS.WHITE,
    },
    counterLimitButtonText: {
        color: COLORS.GRAY_600,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default OfferActions;
