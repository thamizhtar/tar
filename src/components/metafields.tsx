import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import MetafieldsScreen from '../screens/metafields';
import MetafieldSetScreen from '../screens/metafield-set';

interface MetafieldsState {
  screen: 'list' | 'set';
  selectedSetId?: string;
  selectedSetName?: string;
}

interface MetafieldsProps {
  onClose?: () => void;
  onOpenMenu?: () => void;
}

export default function Metafields({ onClose, onOpenMenu }: MetafieldsProps) {
  const [state, setState] = useState<MetafieldsState>({
    screen: 'list',
  });

  const navigateToSet = (setId: string, setName: string) => {
    setState({
      screen: 'set',
      selectedSetId: setId,
      selectedSetName: setName,
    });
  };

  const handleAddSet = () => {
    // Navigate to create new metafield set
    navigateToSet('new', 'New Metafield Set');
  };

  const navigateToList = () => {
    setState({ screen: 'list' });
  };

  const handleSetSave = () => {
    // Navigate back to list and refresh
    navigateToList();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {state.screen === 'list' && (
        <MetafieldsScreen
          onNavigateToSet={navigateToSet}
          onClose={onOpenMenu || handleClose}
          onAddSet={handleAddSet}
        />
      )}

      {/* Full screen modal for edit metafield set */}
      <Modal
        visible={state.screen === 'set'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={navigateToList}
      >
        {state.screen === 'set' && state.selectedSetId && state.selectedSetName && (
          <MetafieldSetScreen
            setId={state.selectedSetId}
            setName={state.selectedSetName}
            onClose={navigateToList}
            onSave={handleSetSave}
          />
        )}
      </Modal>
    </View>
  );
}
