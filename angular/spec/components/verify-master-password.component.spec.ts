// collect all required testing objects for Angular App
import { TestBed, ComponentFixture, async } from "@angular/core/testing";
// for Two-Way binding
import { FormsModule } from '@angular/forms';

import { VerifyMasterPasswordComponent } from '../../src/components/verify-master-password.component';

// define the test suit
describe('VerifyMasterPasswordComponent', () => {
  // dfefine the required objects fot test
  let component: VerifyMasterPasswordComponent;
  // defining the Component Fixture to monitor changed in component
  // e.g. DataBinding changes
  let fixture: ComponentFixture<VerifyMasterPasswordComponent>;
  // define the HTML element
  let button: HTMLElement;

  // define the test env. so that the test will be
  // using Angular standard modules to execute test on component

  beforeEach(() => {
    // define the TestBedConfiguration
    TestBed.configureTestingModule({
      declarations: [VerifyMasterPasswordComponent],
      imports: [FormsModule]
    }).compileComponents(); // the component will be compiled
    // (includes HTML Tremplate)
  });
  // definition for all objects before test starts
  beforeEach(() => {
    // initiaze the fixture so that the component 'selector'
    // and its HTML template will be initialized
    fixture = TestBed.createComponent(VerifyMasterPasswordComponent);
    // read the component's instace to execute method in it
    component = fixture.componentInstance;
    // detect the first databinding changes
    fixture.detectChanges();
  });
  // the test case
  it('should do stuff', () => {
    expect(component).not.toBe(null);
    // // define the product instance
    // const product = new Product(0, '', '', '', '', '', 0);
    // console.log(`Conponent instance ${component}`);
    // product.BasePrice = 4000;
    // component.product = product;
    // // receive the nativeElement for HTML Template DOM
    // const element = fixture.nativeElement;
    // // recive the button
    // button = element.querySelector('.btn-success');
    // // define an event
    // // when the button dispatch the click event the
    // // 'save()' method of the component will be called
    // const eventType = button.dispatchEvent(new Event('click'));
    // // detect any changed in HTML DOM against the dispatched event
    // fixture.detectChanges();
    // // assert the value in the disabled text element
    // expect(element.querySelector('input[disabled]').value).toEqual('800');
  });
});
