<meta charset="utf-8">
<?php
$target_dir = "../skins/";
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);
// Check if image file is a actual image or fake image
if(isset($_POST["submit"])) {
    $check = getimagesize($_FILES["fileToUpload"]["tmp_name"]);
    if($check !== false) {
        echo "" . $check["mime"] . ".";
        $uploadOk = 1;
    } else {
        echo "사진 (.png) 파일만 허용됩니다.";
        $uploadOk = 0;
    }
}
// Check if file already exists
if (file_exists($target_file)) {
    echo "동일한 파일이있습니다";
    $uploadOk = 0;
}
// Check file size
if ($_FILES["fileToUpload"]["size"] > 500000) {
    echo "파일이 너무 큽니다";
    $uploadOk = 0;
}
// Allow certain file formats
if( $imageFileType != "png"  ) {
    echo "사진 (.png) 파일만 허용됩니다.";
    $uploadOk = 0;
}
// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo " 스킨 이미지가없습니다 (파일을 선택해주세요).";
// if everything is ok, try to upload file
} else {
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
        echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " 스킨이 성공적으로 등록되었습니다";
    } else {
        echo "업로드에 오류가있습니다 F5를눌러주세요.";
    }
}
?>
</body>
</html>


