import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  Button,
  useWindowDimensions,
  Alert,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
} from 'react-native-reanimated';

const App = () => {
  const devices = useCameraDevices();
  const [image, setimage] = useState();
  const [annotationname, setannotationname] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const {hasPermission, requestPermission} = useCameraPermission();
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);
  const [camaraclose, setcamaraclose] = useState(true);
  const [isDrawingTriangle, setIsDrawingTriangle] = useState(false);
  const [isbtnvisible, setIsbtnvisible] = useState(true);
  const viewShotRef = useRef(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    } else if (!selectedDevice && devices.length > 0) {
      const backCamera = devices.find(device => device.position === 'back');
      if (backCamera) {
        setSelectedDevice(backCamera);
      } else {
        console.error('No back camera found');
      }
    }
    if (selectedDevice && !cameraRef.current) {
      // console.error("Camera is not yet initialized");
    } else {
      // console.log("Camera is initialized:", cameraRef.current);
    }
  }, [hasPermission, devices, selectedDevice]);

  const takePicture = async () => {
    const photo = await cameraRef.current.takePhoto();
    console.log('phoyo', photo);
    setcamaraclose(false);
    setCapturedImage(`file://${photo.path}`);
  };

  const [exportData, setExportData] = useState(null);

  const exportAnnotations = () => {
    const annotationData = {
      coordinates: {
        x: translationX.value,
        y: translationX.value,
      },
    };
    const jsonData = JSON.stringify(annotationData);
    setExportData(jsonData);
    Alert.alert('Export Annotations', jsonData);
  };
  const exportImage = async () => {
    // Save or use
    try {
      setIsbtnvisible(false);
      const uri = await viewShotRef.current.capture();
      console.log('Captured Image URI:', uri);
      const destinationPath =
        RNFS.DownloadDirectoryPath + `/${annotationname}.png`;
      // Move the captured image to the desired location047
      await RNFS.copyFile(uri, destinationPath);
      Alert.alert(
        'Image saved to:',
        destinationPath,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsbtnvisible(true);
            },
          },
        ],
        {cancelable: false},
      );
      // Now, you can use the captured image from the internal storage
      // For example, you can pass the destinationPath to other components or use it in your application
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };
  
  const translationX = useSharedValue(25);
  const translationY = useSharedValue(150);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      console.log('on update', e);
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(e => {
      console.log('on end', e);
      savedScale.value = scale.value;
      // savedTranslationX.value = e.focalX;
      // savedTranslationY.value = e.focalY;
    })
    .onTouchesMove(e => {
      // console.log('touch move', e);
      const touch = e.allTouches[0]; 
      const {absoluteX, absoluteY} = touch;
      translationX.value = absoluteX; 
      translationY.value = absoluteY; 
    });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translationX.value},
      {translateY: translationY.value},
      {scale: scale.value},
    ],
  }));
  return (
    <View style={styles.container}>
      {selectedDevice && camaraclose && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={selectedDevice}
          isActive={true}
          focusable={true}
          photo={true}
        />
      )}
      {capturedImage && (
        <View style={styles.previewContainer}>
          <ViewShot
            ref={viewShotRef}
            style={{flex: 1, width: '100%'}}
            options={{
              format: 'png',
              quality: 1,
            }}>
            <ImageBackground
              source={{uri: capturedImage}}
              style={styles.previewImage}>
              {isDrawingTriangle && (
                <GestureHandlerRootView
                  style={{...StyleSheet.absoluteFillObject}}>
                  <GestureDetector gesture={pinchGesture}>
                    <Animated.Image
                      source={image}
                      resizeMode={'contain'}
                      style={[
                        {
                          // flex:1,
                          tintColor: '#fff',
                          position: 'absolute',
                          // left: 50,
                          // top: 150,
                          width: 200,
                          height: 150,
                          // backgroundColor: '#fff',
                          // borderWidth: 5,
                          // borderColor: '#fff',
                          // borderRadius: 20,
                        },
                        animatedStyle,
                      ]}></Animated.Image>
                  </GestureDetector>
                </GestureHandlerRootView>
              )}
              {isbtnvisible ? (
                isDrawingTriangle ? (
                  <View>
                    <Button
                      title="back"
                      onPress={() => setIsDrawingTriangle(false)}
                    />
                    <Button
                      title="Export Annotations"
                      onPress={exportAnnotations}
                    />
                    <Button title="Export Image" onPress={exportImage} />
                  </View>
                ) : (
                  <View>
                    <Button
                      title={'Draw Rectangle'}
                      onPress={() => [
                        setimage(require('./src/shape/rectangle.png')),
                        setannotationname('rectangleShapeImage'),
                        setIsDrawingTriangle(true),
                      ]}
                    />
                    <Button
                      title={'Draw triangle'}
                      onPress={() => [
                        setimage(require('./src/shape/triangle.png')),
                        setannotationname('triangleShapeImage'),
                        setIsDrawingTriangle(true),
                      ]}
                    />
                    <Button
                      title={'Draw pentagon'}
                      onPress={() => [
                        setimage(require('./src/shape/pentagon.png')),
                        setannotationname('pentagonShapeImage'),
                        setIsDrawingTriangle(true),
                      ]}
                    />
                    <Button
                      title={'Draw hexagon'}
                      onPress={() => [
                        setimage(require('./src/shape/hexagon.png')),
                        setannotationname('hexagonShapeImage'),
                        setIsDrawingTriangle(true),
                      ]}
                    />
                  </View>
                )
              ) : null}
            </ImageBackground>
          </ViewShot>
        </View>
      )}
      {!capturedImage && (
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <Text style={styles.captureText}>CAPTURE PHOTO</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  captureText: {
    fontSize: 16,
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  strokeColorButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  strokeWidthButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#39579A',
  },
  animated_view: {
    position: 'absolute',
    left: 50,
    top: 150,
    width: 150,
    height: 150,
    // backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#fff',
    // borderRadius: 20,
  },
});
export default App;
