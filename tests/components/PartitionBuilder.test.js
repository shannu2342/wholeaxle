import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PartitionBuilder from '../../../src/components/admin/PartitionBuilder';

// Mock react-native components
jest.mock('react-native', () => {
    const React = require('react');

    const View = ({ children, style, testID, ...props }) => (
        React.createElement('div', { 'data-testid': testID, style, ...props }, children)
    );

    const Text = ({ children, style, testID, ...props }) => (
        React.createElement('span', { 'data-testid': testID, style, ...props }, children)
    );

    const TouchableOpacity = ({ children, onPress, style, testID, ...props }) => (
        React.createElement('button', { 'data-testid': testID, onClick: onPress, style, ...props }, children)
    );

    const Modal = ({ children, visible, animationType, onRequestClose, testID, ...props }) => {
        if (!visible) return null;
        return React.createElement('div', { 'data-testid': testID, onClick: onRequestClose, ...props }, children);
    };

    const ScrollView = ({ children, style, testID, horizontal, showsHorizontalScrollIndicator, ...props }) => (
        React.createElement('div', {
            'data-testid': testID,
            style: { ...style, display: 'flex', flexDirection: horizontal ? 'row' : 'column' },
            ...props
        }, children)
    );

    const TextInput = ({ value, onChangeText, placeholder, style, testID, multiline, numberOfLines, ...props }) => {
        const handleChange = (e) => onChangeText && onChangeText(e.target.value);

        if (multiline) {
            return React.createElement('textarea', {
                'data-testid': testID,
                value, onChange: handleChange, placeholder, style, rows: numberOfLines || 3, ...props
            });
        }

        return React.createElement('input', {
            'data-testid': testID, type: 'text', value, onChange: handleChange, placeholder, style, ...props
        });
    };

    const Switch = ({ value, onValueChange, testID, ...props }) => (
        React.createElement('input', {
            'data-testid': testID, type: 'checkbox', checked: value, onChange: (e) => onValueChange(e.target.checked), ...props
        })
    );

    return {
        View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Switch,
        StyleSheet: { create: (styles) => styles },
        Alert: { alert: jest.fn() }
    };
});

// Mock Redux hooks
jest.mock('react-redux', () => ({
    useDispatch: () => jest.fn(),
    useSelector: (selector) => selector({
        admin: {
            partitionBuilder: {
                isOpen: true,
                editingPartition: null,
                formData: {
                    name: '',
                    type: 'ecommerce',
                    icon: '📦',
                    color: '#3B82F6',
                    features: [],
                    attributes: {},
                },
            },
            loading: false,
            error: null,
        },
    }),
}));

// Mock adminSlice actions
jest.mock('../../../src/store/slices/adminSlice', () => ({
    closePartitionBuilder: () => ({ type: 'admin/closePartitionBuilder' }),
    updatePartitionFormData: (data) => ({ type: 'admin/updatePartitionFormData', payload: data }),
    addPartitionFeature: (feature) => ({ type: 'admin/addPartitionFeature', payload: feature }),
    removePartitionFeature: (feature) => ({ type: 'admin/removePartitionFeature', payload: feature }),
    updatePartitionAttribute: (data) => ({ type: 'admin/updatePartitionAttribute', payload: data }),
    createPartition: (data) => ({ type: 'admin/createPartition', payload: data }),
    updatePartition: (data) => ({ type: 'admin/updatePartition', payload: data }),
}));

const renderWithProvider = (component) => {
    return render(<Provider store={configureStore({ reducer: { admin: (state = {}) => state } })}>{component}</Provider>);
};

describe('PartitionBuilder Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the modal when isOpen is true', () => {
            renderWithProvider(<PartitionBuilder />);
            expect(screen.getByText('Create New Partition')).toBeTruthy();
        });

        it('should show correct title for editing mode', () => {
            jest.spyOn(require('react-redux'), 'useSelector').mockReturnValue({
                admin: {
                    partitionBuilder: {
                        isOpen: true,
                        editingPartition: { id: 'test-partition', name: 'Test Partition' },
                        formData: { name: 'Test Partition' },
                    },
                    loading: false,
                    error: null,
                },
            });

            renderWithProvider(<PartitionBuilder />);
            expect(screen.getByText('Edit Partition')).toBeTruthy();
        });
    });

    describe('Tab Navigation', () => {
        it('should render all tabs', () => {
            renderWithProvider(<PartitionBuilder />);

            expect(screen.getByText('⚙️ Basic Info')).toBeTruthy();
            expect(screen.getByText('🔧 Features')).toBeTruthy();
            expect(screen.getByText('🏷️ Attributes')).toBeTruthy();
            expect(screen.getByText('🔄 Workflow')).toBeTruthy();
        });

        it('should switch tabs when clicked', () => {
            renderWithProvider(<PartitionBuilder />);

            const featuresTab = screen.getByText('🔧 Features');
            fireEvent.click(featuresTab);

            // Verify feature categories are visible
            expect(screen.getByText('Operations')).toBeTruthy();
        });
    });

    describe('Basic Info Tab', () => {
        it('should handle name input changes', () => {
            renderWithProvider(<PartitionBuilder />);

            const nameInput = screen.getByPlaceholderText('Enter partition name');
            fireEvent.changeText(nameInput, 'Test Partition');

            expect(nameInput.value).toBe('Test Partition');
        });

        it('should allow partition type selection', () => {
            renderWithProvider(<PartitionBuilder />);

            const typeCards = screen.getAllByText(/E-commerce|Service Marketplace/);
            fireEvent.click(typeCards[1]);

            expect(screen.getByText('Service Marketplace')).toBeTruthy();
        });
    });

    describe('Features Tab', () => {
        beforeEach(() => {
            renderWithProvider(<PartitionBuilder />);
            const featuresTab = screen.getByText('🔧 Features');
            fireEvent.click(featuresTab);
        });

        it('should render feature categories', () => {
            expect(screen.getByText('Operations')).toBeTruthy();
            expect(screen.getByText('Catalog')).toBeTruthy();
        });

        it('should toggle features when clicked', () => {
            const inventoryFeature = screen.getByText('Inventory Management');
            fireEvent.click(inventoryFeature);

            const switchElement = inventoryFeature.closest('button').querySelector('input[type="checkbox"]');
            expect(switchElement.checked).toBe(true);
        });
    });

    describe('Attributes Tab', () => {
        beforeEach(() => {
            renderWithProvider(<PartitionBuilder />);
            const attributesTab = screen.getByText('🏷️ Attributes');
            fireEvent.click(attributesTab);
        });

        it('should render attribute form', () => {
            expect(screen.getByPlaceholderText('e.g., brand, category, color')).toBeTruthy();
            expect(screen.getByPlaceholderText('e.g., Samsung, Apple, Nike')).toBeTruthy();
        });

        it('should add new attributes', () => {
            const keyInput = screen.getByPlaceholderText('e.g., brand, category, color');
            const valueInput = screen.getByPlaceholderText('e.g., Samsung, Apple, Nike');
            const addButton = screen.getByText('Add Attribute');

            fireEvent.changeText(keyInput, 'brand');
            fireEvent.changeText(valueInput, 'Samsung, Apple, Nike');
            fireEvent.click(addButton);

            expect(screen.getByText('brand')).toBeTruthy();
            expect(screen.getByText('Samsung, Apple, Nike')).toBeTruthy();
        });

        it('should not add empty attributes', () => {
            const addButton = screen.getByText('Add Attribute');
            fireEvent.click(addButton);

            expect(screen.queryByText('brand')).toBeNull();
        });
    });

    describe('Form Validation', () => {
        it('should show validation error for empty name', async () => {
            renderWithProvider(<PartitionBuilder />);

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Partition name is required and cannot be empty')).toBeTruthy();
            });
        });

        it('should show validation error for short name', async () => {
            renderWithProvider(<PartitionBuilder />);

            const nameInput = screen.getByPlaceholderText('Enter partition name');
            fireEvent.changeText(nameInput, 'ab');

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Partition name must be at least 3 characters long')).toBeTruthy();
            });
        });
    });

    describe('Modal Actions', () => {
        it('should close modal when cancel is clicked', () => {
            renderWithProvider(<PartitionBuilder />);

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);
        });
    });
});