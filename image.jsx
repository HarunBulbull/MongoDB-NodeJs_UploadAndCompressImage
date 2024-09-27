import React, { useState, useEffect, useCallback } from 'react';
import {Button, message, Popconfirm} from 'antd';
import './image.css';

export const Image = ({onClose, onImagesSelected, images }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [fileLabel, setFileLabel] = useState("Resim seç");
  const [buttonLabel, setButtonLabel] = useState("Yükle");
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const maxImages = 11;
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [dataSource, setDataSoruce] = useState([]);
  const apiURL = import.meta.env.VITE_API_BASE_URL;
  const imageURL = import.meta.env.VITE_IMAGE_BASE_URL;

  useEffect(() => {
    if(images){
      const data = []
      images.slice(0,-1).split("\n").map((link) => (link != "" && (data.push(link.trim()))));
      setSelectedImages(data);
      setSelectedCount(data.length);
    }
  }, [images]);

  const handleFile = (e) => {
    setSelectedImage(e.target.files[0])
    const fileName = e.target.files[0].name;
    const MAX_FILE_NAME_LENGTH = 20;
    if (fileName.length > MAX_FILE_NAME_LENGTH) {
      const firstPart = fileName.slice(0, MAX_FILE_NAME_LENGTH - 3);
      const lastPart = fileName.slice(fileName.length - 3);
      const shortenedFileName = `${firstPart}...${lastPart}`;
      setFileLabel(shortenedFileName);
    } else {
      setFileLabel(fileName);
    }
  }

  const handleSubmit = async () => {
    if(!selectedImage.type.includes('image/')) {return message.error("Geçersiz dosya!")}
    if(fileLabel == "Resim seç") {return message.error("Bir resim seçmelisin!")}
    setButtonLabel("Yükleniyor...")
    setButtonDisabled(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    try {
      const res = await fetch(`${apiURL}/api/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      data.filename = data.filename.split('.')[0] + "-compressed.jpeg";
      await fetch(`${apiURL}/api/image/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.ZAFER_API_KEY
        },
        body: JSON.stringify(data),
      });
      fetchData();
      setFileLabel("Resim seç");

    } catch (error) {
      console.error(error);

    }
    setButtonLabel("Yükle")
    setButtonDisabled(false);
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${apiURL}/api/image/allImages`, {
        method: "GET",
        headers: {
          "x-api-key": import.meta.env.ZAFER_API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDataSoruce(data);

      } else {
        message.error("Veri Getirme Başarısız.");
      }
    } catch (error) {
      console.log("Veri hatası:", error);
    }
  }, [apiURL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelect = (filename) => {
    const index = selectedImages.indexOf(filename);
    if(index != -1){
      setSelectedCount(selectedCount-1);
      const data = selectedImages;
      data.splice(index, 1);
      setSelectedImages(data)
    }else{
      if(selectedCount<maxImages){
        setSelectedCount(selectedCount+1);
        const data = selectedImages;
        data.push(filename)
        setSelectedImages(data)
      }else{
        message.error("En fazla " + maxImages + " adet resim seçebilirsiniz!")
      }
    }
  }

  const deleteList = () => {
    setSelectedImages([])
    setSelectedCount(0)
  }

  const savePhotos = () => {
    const data = selectedImages.reduce((acc, image) => acc + image + '\n', '');
    onImagesSelected(data);
  }

  return (
    <div>
      <span className='blackblurbg' />
      <div className="selectImage-area">
        <form className="selectImage-head">
          <div className="selectImageHead-inputs">
            <input type="file" id='file' onChange={handleFile} />
            <label htmlFor="file">{fileLabel}</label>
            <Button type="primary" onClick={() => handleSubmit()} disabled={buttonDisabled}>{buttonLabel}</Button>
          </div>
          <b>{selectedCount} Resim seçildi</b>
        </form>
        <div className="selectImage-All">
          {dataSource.map((d, i) => (
            <div className='selectImage-image' key={i} >
              <img src={imageURL + d.filename} onClick={() => handleSelect(d.filename)} className={selectedImages.indexOf(d.filename) > -1 ? (selectedImages.indexOf(d.filename) == 0 ? "primarySelect" : "selectedImage") : ("")}/>
              {selectedImages.indexOf(d.filename) > -1 ? (selectedImages.indexOf(d.filename) == 0 ? <b>Kapak Resmi</b> : <b>{selectedImages.indexOf(d.filename)}. Resim</b>) : <b>Seçilmedi</b>}
            </div>
          ))}
        </div>
        <div className="selectImage-bottom">
          <Popconfirm title="Temizlensin Mi?" description="Temizlemek istediğinize emin misiniz?" okText="Evet" cancelText="Hayır" onConfirm={() => deleteList()}><Button disabled={!selectedCount>0} color="default" variant="solid">Temizle</Button></Popconfirm>
          <Button type='primary' disabled={!selectedCount>0} onClick={() => savePhotos()}>Kaydet</Button>
          <Popconfirm title="İptal Edilsin Mi?" description="İptal etmek istediğinize emin misiniz?" okText="Evet" cancelText="Hayır" onConfirm={() => onClose()}><Button type='primary' danger>İptal</Button></Popconfirm>
        </div>
      </div>
    </div>
  );
}
