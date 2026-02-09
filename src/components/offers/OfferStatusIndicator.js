import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/Colors';
import { OFFER_STATES } from '../../store/slices/offersSlice';

const OfferStatusIndicator = ({ status, size = 'medium', style }) => {
    const getStatusConfig = () => {
        switch (status) {
            case OFFER_STATES.PENDING:
                return {
                    icon: 'schedule',
                    label: 'Pending',
                    color: COLORS.WARNING,
                    bgColor: COLORS.WARNING_LIGHT,
                    borderColor: COLORS.WARNING
                };
            case OFFER_STATES.ACCEPTED:
                return {
                    icon: 'check-circle',
                    label: 'Accepted',
                    color: COLORS.SUCCESS,
                    bgColor: COLORS.SUCCESS_LIGHT,
                    borderColor: COLORS.SUCCESS
                };
            case OFFER_STATES.REJECTED:
                return {
                    icon: 'cancel',
                    label: 'Rejected',
                    color: COLORS.ERROR,
                    bgColor: COLORS.ERROR_LIGHT,
                    borderColor: COLORS.ERROR
                };
            case OFFER_STATES.COUNTERED:
                return {
                    icon: 'swap-horiz',
                    label: 'Countered',
                    color: COLORS.INFO,
                    bgColor: COLORS.INFO_LIGHT,
                    borderColor: COLORS.INFO
                };
            case OFFER_STATES.EXPIRED:
                return {
                    icon: 'access-time',
                    label: 'Expired',
                    color: COLORS.GRAY_600,
                    bgColor: COLORS.GRAY_200,
                    borderColor: COLORS.GRAY_400
                };
            case OFFER_STATES.CANCELLED:
                return {
                    icon: 'block',
                    label: 'Cancelled',
                    color: COLORS.GRAY_600,
                    bgColor: COLORS.GRAY_200,
                    borderColor: COLORS.GRAY_400
                };
            default:
                return {
                    icon: 'help',
                    label: 'Unknown',
                    color: COLORS.GRAY_600,
                    bgColor: COLORS.GRAY_200,
                    borderColor: COLORS.GRAY_400
                };
        }
    };

    const getSizeConfig = () => {
        switch (size) {
            case 'small':
                return {
                    container: {
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                    },
                    icon: {
                        fontSize: 12,
                    },
                    text: {
                        fontSize: 10,
                        marginLeft: 2,
                    }
                };
            case 'large':
                return {
                    container: {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                    },
                    icon: {
                        fontSize: 18,
                    },
                    text: {
                        fontSize: 14,
                        marginLeft: 4,
                        fontWeight: '600',
                    }
                };
            default: // medium
                return {
                    container: {
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 10,
                    },
                    icon: {
                        fontSize: 14,
                    },
                    text: {
                        fontSize: 11,
                        marginLeft: 3,
                        fontWeight: '500',
                    }
                };
        }
    };

    const statusConfig = getStatusConfig();
    const sizeConfig = getSizeConfig();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: statusConfig.bgColor,
                    borderColor: statusConfig.borderColor,
                    borderWidth: 1,
                },
                sizeConfig.container,
                style
            ]}
        >
            <Icon
                name={statusConfig.icon}
                color={statusConfig.color}
                size={sizeConfig.icon.fontSize}
            />
            <Text
                style={[
                    styles.text,
                    { color: statusConfig.color },
                    sizeConfig.text
                ]}
            >
                {statusConfig.label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '500',
    },
});

export default OfferStatusIndicator;