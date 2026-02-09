import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints for different device sizes
const BREAKPOINTS = {
    small: 320,
    medium: 768,
    large: 1024,
    xlarge: 1440,
};

// Responsive Container
export const ResponsiveContainer = memo(({
    children,
    style,
    maxWidth,
    padding = 16,
    ...props
}) => {
    const themeMode = useSelector(state => state.theme?.mode || 'light');

    const containerStyle = useMemo(() => {
        const baseStyle = {
            width: '100%',
            maxWidth: maxWidth || '100%',
            alignSelf: 'center',
            paddingHorizontal: padding,
        };

        // Add theme-based styles
        if (themeMode === 'dark') {
            baseStyle.backgroundColor = '#000000';
        }

        return baseStyle;
    }, [themeMode, maxWidth, padding]);

    return (
        <View style={[containerStyle, style]} {...props}>
            {children}
        </View>
    );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

// Responsive Grid
export const ResponsiveGrid = memo(({
    children,
    columns = 1,
    spacing = 8,
    style,
    ...props
}) => {
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.xlarge) return 'xlarge';
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const gridColumns = useMemo(() => {
        switch (screenSize) {
            case 'xlarge':
                return Math.min(columns * 2, 6);
            case 'large':
                return Math.min(columns * 2, 4);
            case 'medium':
                return Math.min(columns * 2, 3);
            default:
                return columns;
        }
    }, [columns, screenSize]);

    const itemWidth = useMemo(() => {
        const totalSpacing = spacing * (gridColumns - 1);
        return (screenWidth - totalSpacing - 32) / gridColumns;
    }, [screenWidth, gridColumns, spacing]);

    return (
        <View style={[styles.gridContainer, style]} {...props}>
            {React.Children.map(children, (child, index) => (
                <View
                    key={index}
                    style={{
                        width: itemWidth,
                        marginRight: index % gridColumns === gridColumns - 1 ? 0 : spacing,
                        marginBottom: spacing,
                    }}
                >
                    {child}
                </View>
            ))}
        </View>
    );
});

ResponsiveGrid.displayName = 'ResponsiveGrid';

// Responsive Flex Layout
export const ResponsiveFlex = memo(({
    children,
    direction = 'row',
    justify = 'flex-start',
    align = 'stretch',
    wrap = 'nowrap',
    style,
    ...props
}) => {
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const flexDirection = useMemo(() => {
        // On small screens, stack items vertically
        if (screenSize === 'small' && direction === 'row') {
            return 'column';
        }
        return direction;
    }, [direction, screenSize]);

    const flexStyles = useMemo(() => {
        return {
            flexDirection,
            justifyContent: justify,
            alignItems: align,
            flexWrap: wrap,
        };
    }, [flexDirection, justify, align, wrap]);

    return (
        <View style={[flexStyles, style]} {...props}>
            {children}
        </View>
    );
});

ResponsiveFlex.displayName = 'ResponsiveFlex';

// Responsive Text
export const ResponsiveText = memo(({
    children,
    style,
    fontSize,
    lineHeight,
    fontWeight,
    ...props
}) => {
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.xlarge) return 'xlarge';
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const responsiveFontSize = useMemo(() => {
        if (!fontSize) return undefined;

        switch (screenSize) {
            case 'xlarge':
                return fontSize * 1.2;
            case 'large':
                return fontSize * 1.1;
            case 'medium':
                return fontSize;
            default:
                return fontSize * 0.9;
        }
    }, [fontSize, screenSize]);

    const responsiveLineHeight = useMemo(() => {
        if (!lineHeight) return undefined;

        return responsiveFontSize ? responsiveFontSize * 1.4 : lineHeight;
    }, [lineHeight, responsiveFontSize]);

    const textStyle = useMemo(() => {
        const style = {};

        if (responsiveFontSize) {
            style.fontSize = responsiveFontSize;
        }

        if (responsiveLineHeight) {
            style.lineHeight = responsiveLineHeight;
        }

        if (fontWeight) {
            style.fontWeight = fontWeight;
        }

        return style;
    }, [responsiveFontSize, responsiveLineHeight, fontWeight]);

    return (
        <Text style={[textStyle, style]} {...props}>
            {children}
        </Text>
    );
});

ResponsiveText.displayName = 'ResponsiveText';

// Responsive Spacer
export const ResponsiveSpacer = memo(({
    size = 16,
    direction = 'vertical',
    style,
    ...props
}) => {
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const responsiveSize = useMemo(() => {
        switch (screenSize) {
            case 'large':
                return size * 1.5;
            case 'medium':
                return size * 1.2;
            default:
                return size;
        }
    }, [size, screenSize]);

    const spacerStyle = useMemo(() => {
        if (direction === 'horizontal') {
            return { width: responsiveSize };
        }
        return { height: responsiveSize };
    }, [responsiveSize, direction]);

    return <View style={[spacerStyle, style]} {...props} />;
});

ResponsiveSpacer.displayName = 'ResponsiveSpacer';

// Responsive Card
export const ResponsiveCard = memo(({
    children,
    padding = 16,
    margin = 8,
    borderRadius = 12,
    elevation = 2,
    style,
    ...props
}) => {
    const themeMode = useSelector(state => state.theme?.mode || 'light');
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const cardStyles = useMemo(() => {
        const responsivePadding = padding * (screenSize === 'large' ? 1.5 : 1);
        const responsiveMargin = margin * (screenSize === 'large' ? 1.5 : 1);

        return {
            padding: responsivePadding,
            margin: responsiveMargin,
            borderRadius: borderRadius,
            backgroundColor: themeMode === 'dark' ? '#1C1C1E' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: themeMode === 'dark' ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: elevation,
        };
    }, [padding, margin, borderRadius, elevation, themeMode, screenSize]);

    return (
        <View style={[cardStyles, style]} {...props}>
            {children}
        </View>
    );
});

ResponsiveCard.displayName = 'ResponsiveCard';

// Responsive Button
export const ResponsiveButton = memo(({
    children,
    paddingVertical = 12,
    paddingHorizontal = 24,
    fontSize = 16,
    style,
    ...props
}) => {
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const buttonStyles = useMemo(() => {
        const responsivePaddingVertical = paddingVertical * (screenSize === 'large' ? 1.2 : 1);
        const responsivePaddingHorizontal = paddingHorizontal * (screenSize === 'large' ? 1.2 : 1);
        const responsiveFontSize = fontSize * (screenSize === 'large' ? 1.1 : 1);

        return {
            paddingVertical: responsivePaddingVertical,
            paddingHorizontal: responsivePaddingHorizontal,
            fontSize: responsiveFontSize,
        };
    }, [paddingVertical, paddingHorizontal, fontSize, screenSize]);

    return (
        <TouchableOpacity style={[buttonStyles, style]} {...props}>
            {children}
        </TouchableOpacity>
    );
});

ResponsiveButton.displayName = 'ResponsiveButton';

// Chat-specific responsive layout
export const ChatLayout = memo(({
    header,
    messages,
    input,
    typingIndicator,
    style,
    ...props
}) => {
    const screenSize = useMemo(() => {
        if (screenWidth >= BREAKPOINTS.large) return 'large';
        if (screenWidth >= BREAKPOINTS.medium) return 'medium';
        return 'small';
    }, [screenWidth]);

    const layoutStyles = useMemo(() => {
        const isLargeScreen = screenSize === 'large';

        return {
            flex: 1,
            flexDirection: 'column',
            backgroundColor: '#F5F5F5',
            paddingHorizontal: isLargeScreen ? 24 : 16,
        };
    }, [screenSize]);

    return (
        <View style={[layoutStyles, style]} {...props}>
            {header && <View style={styles.header}>{header}</View>}

            <View style={styles.messagesContainer}>
                {messages}
                {typingIndicator}
            </View>

            {input && <View style={styles.inputContainer}>{input}</View>}
        </View>
    );
});

ChatLayout.displayName = 'ChatLayout';

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    header: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    messagesContainer: {
        flex: 1,
        paddingVertical: 8,
    },
    inputContainer: {
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
});

// Export all responsive components
const ResponsiveLayout = {
    ResponsiveContainer,
    ResponsiveGrid,
    ResponsiveFlex,
    ResponsiveText,
    ResponsiveSpacer,
    ResponsiveCard,
    ResponsiveButton,
    ChatLayout,
};

export default ResponsiveLayout;