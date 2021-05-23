import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  // todo : create a form within its own component
  title = 'client';
  upload_txt = "Upload Position referer and Survey results files";
  datas: object = {};
  uploaded_files: Array <File> = [];

  
  constructor(private appService: AppService) {}
  ngOnInit(): void {
  }

  // update the text into the button and get the file data
  fileChange(e: any) {
    this.uploaded_files = e.target.files;
    this.upload_txt = this.uploaded_files.length+" files has been loaded";
  }

  // when call we send the files to the server
  onSubmit() {
    const form_data = new FormData();

    // format the files informations to be sent 
    for (let i = 0; i < this.uploaded_files.length; i++){
      const file = this.uploaded_files[i];
      form_data.append('files', file);
    }
    
    // call service method to send files to server
    this.appService.sendFiles(form_data).subscribe(ret => {
      this.upload_txt = "Al files has been sent";
      setTimeout(() => {
        this.upload_txt = "Upload Position referer and Survey results files";
      }, 5000);
    });


  }
}
