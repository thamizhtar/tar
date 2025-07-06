import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import OptionsScreen from '../screens/options';
import SetScreen from '../screens/set-simple';

type OptionsScreenType = 'list' | 'set';

interface OptionsState {
  screen: OptionsScreenType;
  selectedSetId?: string;
  selectedSetName?: string;
}

interface OptionsProps {
  onClose?: () => void;
  onOpenMenu?: () => void;
}

export default function Options({ onClose, onOpenMenu }: OptionsProps) {
  const [state, setState] = useState<OptionsState>({
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
    // Navigate to create new option set
    navigateToSet('new', 'New Option Set');
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
        <OptionsScreen
          onNavigateToSet={navigateToSet}
          onClose={onOpenMenu || handleClose}
          onAddSet={handleAddSet}
        />
      )}

      {/* Full screen modal for edit option set */}
      <Modal
        visible={state.screen === 'set'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={navigateToList}
      >
        {state.screen === 'set' && state.selectedSetId && state.selectedSetName && (
          <SetScreen
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
