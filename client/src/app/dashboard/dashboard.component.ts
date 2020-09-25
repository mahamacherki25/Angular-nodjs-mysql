import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from '../core.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  private serverHeartbeat: string;
  private serverMessage: any;
  private items = [];
  private selectedItem: any;
  private ratingClicked: number;
  private itemIdRatingClicked: string;
  constructor(
    private coreService: CoreService,
    private router: Router ) {
  }

  ngOnInit() {
    this.checkLoggedIn( () => {
      this.coreService.getRemoteEvents().subscribe( {
        next: evt => this.handleRemoteEvent( evt )
      } );
      this.coreService.sendCommand( { type: 'snap'} );
    } );
  }

  checkLoggedIn( runIfOK ) {
    if( !this.coreService.isLoggedIn() ) {
      console.log( "Not logged in, redirect to login page" );
      this.router.navigate( ['login'] );
    } else {
      runIfOK();
    }
  }

  handleRemoteEvent( evt ) {
    this.serverMessage = JSON.stringify( evt );
    switch( evt.type ) {
      case 'hb':
        this.serverHeartbeat = evt.data;
       
        break;
      case 'itemadded':
        this.items.push( evt.data );
        break;
      case 'itemupdated':
        const item = this.items.find( i => i.id === evt.data.id );
        item.value = evt.data.value;
        
 

        break;
      case 'itemdeleted':
        const idx = this.items.findIndex( i => i.id === evt.data.id );
        this.items.splice( idx, 1 );
        break;
       case 'ratingpdated':
           const itemr = this.items.find( i => i.id === evt.data.id );
          // item.rating = evt.data.rating;
          break; 
    }
  }

  onSelectEdit( item ) {
    this.selectedItem = item;
  }

  onDelete( item ) {
    this.checkLoggedIn( () => {
      this.coreService.sendCommand( { type: 'delitem', data: { id: item.id, value: item.value } } );
    } );
  }


  onAdd( evt, id, value ) {
    evt.preventDefault();
    this.checkLoggedIn( () => {
      this.coreService.sendCommand( { type: 'additem', data: { id: id, value: value,rating :"0"} } );
    } );
  }

  onEdit( evt, id, value) {
    evt.preventDefault();
    this.checkLoggedIn( () => {
      this.coreService.sendCommand( { type: 'updateitem', data: { id: id, value: value } } );
    } );
  }
  ratingComponentClick(clickObj: any, item): void {
   
    const itemr = this.items.find(((i: any) => i.id === clickObj.itemId));
   
    if (!!itemr) {
      itemr.rating = clickObj.rating;
      this.ratingClicked = clickObj.rating;
      this.itemIdRatingClicked = itemr.company;
      
     // clickObj.preventDefault();
      this.checkLoggedIn( () => {
      this.coreService.sendCommand( { type: 'ratingpdated', data: { id:item.id, rating: this.ratingClicked} } );
    } ); 
    
  } }
  
}
