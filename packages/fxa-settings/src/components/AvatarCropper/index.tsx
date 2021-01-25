// /* This Source Code Form is subject to the terms of the Mozilla Public
//  * License, v. 2.0. If a copy of the MPL was not distributed with this
//  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// import React from 'react';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// // import { ReactComponent as ZoomIn } from './zoom-in.svg';
// // import { ReactComponent as ZoomOut } from './zoom-out.svg';
// // import { ReactComponent as Rotate } from './rotate.svg';

// type AvatarCropperProps = {
//   src: string;
//   style: string;
//   onCrop: Function;
// };

// export const AvatarCropper = (_: AvatarCropperProps) => {
//   return <Cropper
//     src="https://raw.githubusercontent.com/roadmanfong/react-cropper/master/example/img/child.jpg"
//     style={{ height: 400, width: "100%" }}
//     initialAspectRatio={16 / 9}
//     guides={false}
//     crop={onCrop}
//     ref={cropperRef}
//   />
// };

// export default AvatarCropper;

import React, { useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import picture from './child.jpg';

const AvatarCropper: React.FC = () => {
  const cropperRef = useRef<HTMLImageElement>(null);
  const onCrop = () => {
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    console.log(cropper.getCroppedCanvas().toDataURL());
  };

  useEffect(() => {
    /* tslint:disable */
    const imageElement: any = cropperRef?.current;
    const cropper: any = imageElement?.cropper;
    if (cropper) {
      cropper.setCropBoxData({
        top: '10%',
        left: '10%',
        width: 160,
        height: 160
      });
    }

    /* tslint:enable */
  }, [cropperRef]);

  return (
    <Cropper
      src={picture}
      ref={cropperRef}
      style={{ height: 300, width: "100%" }}
      // Cropper.js options
      initialAspectRatio={16 / 9}
      guides={false}
      crop={onCrop}
      minCropBoxWidth={64}
      minCropBoxHeight={64}
    />
  );
};

export default AvatarCropper
