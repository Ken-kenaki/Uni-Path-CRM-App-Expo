
import { ThemedText } from '@/components/themed-text';
import { View } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <View className='flex-1 items-center justify-center'>
      <ThemedText className='bg-red-500 text-black'>Home Screen</ThemedText>
    </View>
  );
}

